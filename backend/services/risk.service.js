import mongoose from 'mongoose';
import Incident from '../models/Incident.model.js';
import Zone from '../models/Zone.model.js';
import { getWeatherData } from './weather.service.js';

/**
 * Calculates risk score for a zone based on incidents and weather
 * @param {Object} zone - Zone document
 * @param {Date} fromDate - Start date for incident filtering
 * @param {Date} toDate - End date for incident filtering
 * @returns {Promise<Object>} Risk score and details
 */
export const calculateZoneRiskScore = async (zone, fromDate = null, toDate = null) => {
  try {
    // Build query for incidents in this zone
    const query = {
      zoneId: zone._id,
      isDeleted: false
    };

    if (fromDate || toDate) {
      query.incidentDate = {};
      if (fromDate) query.incidentDate.$gte = new Date(fromDate);
      if (toDate) query.incidentDate.$lte = new Date(toDate);
    }

    // Get all incidents for this zone
    const incidents = await Incident.find(query);

    // Base risk score components
    let baseScore = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Total incident count (weight: 2 points per incident, max 50 points)
    const totalIncidents = incidents.length;
    baseScore += Math.min(totalIncidents * 2, 50);

    // 2. Recent incidents (last 30 days) - higher weight
    const recentIncidents = incidents.filter(inc => 
      new Date(inc.incidentDate) >= thirtyDaysAgo
    );
    baseScore += Math.min(recentIncidents.length * 5, 30);

    // 3. Very recent incidents (last 7 days) - highest weight
    const veryRecentIncidents = incidents.filter(inc => 
      new Date(inc.incidentDate) >= sevenDaysAgo
    );
    baseScore += Math.min(veryRecentIncidents.length * 10, 20);

    // 4. Severity-based scoring (prioritize highest severity incidents)
    const severityWeights = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    
    // Count incidents by severity
    const severityCounts = {
      LOW: incidents.filter(inc => inc.severity === 'LOW').length,
      MEDIUM: incidents.filter(inc => inc.severity === 'MEDIUM').length,
      HIGH: incidents.filter(inc => inc.severity === 'HIGH').length,
      CRITICAL: incidents.filter(inc => inc.severity === 'CRITICAL').length
    };
    
    if (incidents.length > 0) {
      // Calculate weighted average severity
      const avgSeverity = incidents.reduce((sum, inc) => 
        sum + (severityWeights[inc.severity] || 2), 0
      ) / incidents.length;
      baseScore += avgSeverity * 5; // Max 20 points
      
      // Additional points for high-severity incidents (prioritize CRITICAL and HIGH)
      baseScore += severityCounts.CRITICAL * 15; // Max 30 points
      baseScore += severityCounts.HIGH * 8; // Max 20 points
    }

    // 5. Unverified incidents increase risk
    const unverifiedCount = incidents.filter(inc => inc.status === 'UNVERIFIED').length;
    baseScore += unverifiedCount * 3;

    // 6. Weather-based multiplier
    // Zone uses geometry.coordinates (Polygon), get first point for weather API
    let lon, lat;
    if (zone.geometry && zone.geometry.coordinates && zone.geometry.coordinates[0] && zone.geometry.coordinates[0][0]) {
      const firstPoint = zone.geometry.coordinates[0][0];
      [lon, lat] = firstPoint;
    } else {
      // Fallback if geometry is missing - use default coordinates
      lon = 81.0;
      lat = 6.0;
    }
    const weatherData = await getWeatherData(lat, lon);
    const weatherMultiplier = weatherData.multiplier || 1.0;

    // Calculate final risk score (0-100 scale)
    const finalScore = Math.min(100, Math.round(baseScore * weatherMultiplier));

    // Determine risk level based on score AND severity
    // Prioritize severity: if zone has CRITICAL incidents, it should be at least HIGH risk
    let riskLevel = 'LOW';
    
    // Severity-based risk level override (prioritize severity)
    if (severityCounts.CRITICAL > 0) {
      // Zones with CRITICAL incidents should be HIGH or CRITICAL
      if (finalScore >= 60 || severityCounts.CRITICAL >= 2) {
        riskLevel = 'CRITICAL';
      } else {
        riskLevel = 'HIGH';
      }
    } else if (severityCounts.HIGH > 0) {
      // Zones with HIGH incidents should be at least MEDIUM
      if (finalScore >= 50 || severityCounts.HIGH >= 3) {
        riskLevel = 'HIGH';
      } else {
        riskLevel = 'MEDIUM';
      }
    } else {
      // Score-based risk level for zones without high-severity incidents
      if (finalScore >= 70) riskLevel = 'CRITICAL';
      else if (finalScore >= 50) riskLevel = 'HIGH';
      else if (finalScore >= 30) riskLevel = 'MEDIUM';
    }

    return {
      zoneId: zone._id,
      zoneName: zone.name,
      riskScore: finalScore,
      riskLevel,
      weatherMultiplier: weatherMultiplier.toFixed(2),
      weatherCondition: weatherData.condition,
      incidentCount: totalIncidents,
      averageSeverity: incidents.length > 0 
        ? Object.keys(severityWeights).find(key => 
            severityWeights[key] === Math.round(
              incidents.reduce((sum, inc) => sum + (severityWeights[inc.severity] || 2), 0) / incidents.length
            )
          ) || 'MEDIUM'
        : 'N/A',
      severityBreakdown: {
        critical: severityCounts.CRITICAL,
        high: severityCounts.HIGH,
        medium: severityCounts.MEDIUM,
        low: severityCounts.LOW
      },
      weatherData: {
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        description: weatherData.description
      }
    };
  } catch (error) {
    console.error('Error calculating risk score:', error);
    throw error;
  }
};

/**
 * Generates risk map for a protected area
 * @param {string} protectedAreaId - Protected Area ID
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @returns {Promise<Array>} Array of zone risk scores
 */
export const generateRiskMap = async (protectedAreaId, fromDate = null, toDate = null) => {
  try {
    // Convert protectedAreaId to ObjectId for proper querying
    // Since Zone schema defines protectedAreaId as ObjectId, we should query with ObjectId
    const isObjectIdValid = mongoose.Types.ObjectId.isValid(protectedAreaId);
    
    if (!isObjectIdValid) {
      console.warn(`Invalid ObjectId format for protectedAreaId: ${protectedAreaId}`);
      return [];
    }
    
    const objectIdQuery = new mongoose.Types.ObjectId(protectedAreaId);
    const stringQuery = String(protectedAreaId);
    
    // Check what zones exist for incidents in this protected area
    const incidents = await Incident.find({ 
      protectedAreaId: objectIdQuery,
      isDeleted: false 
    }).limit(5);
    
    if (incidents.length > 0) {
      const zoneIds = [...new Set(incidents.map(inc => inc.zoneId?.toString()))];
    }
    
    // Query zones - try both ObjectId and string formats to handle data inconsistencies
    // protectedAreaId should be ObjectId, but handle cases where it might be stored as string
    // Query all zones that might match (using $or for protectedAreaId)
    let zones = await Zone.find({
      $or: [
        { protectedAreaId: objectIdQuery },
        { protectedAreaId: stringQuery }
      ]
    });

    // Filter to ensure zones match the protectedAreaId and are active
    zones = zones.filter(zone => {
      // Normalize protectedAreaId for comparison
      const zoneProtectedAreaId = zone.protectedAreaId?.toString ? zone.protectedAreaId.toString() : String(zone.protectedAreaId);
      const matchesProtectedArea = zoneProtectedAreaId === stringQuery;
      
      // Check if zone is active (status defaults to ACTIVE in schema)
      const isActive = !zone.status || zone.status === 'ACTIVE';
      
      return matchesProtectedArea && isActive;
    });
    
    // Fallback: If no zones found by protectedAreaId, try to find zones from incidents
    if (zones.length === 0 && incidents.length > 0) {
      const zoneIds = [...new Set(incidents.map(inc => inc.zoneId?.toString()).filter(Boolean))];
      
      const fallbackZones = await Zone.find({
        _id: { $in: zoneIds.map(id => new mongoose.Types.ObjectId(id)) }
      });
      
      // Filter for active zones
      zones = fallbackZones.filter(zone => {
        const isActive = !zone.status || zone.status === 'ACTIVE';
        return isActive;
      });
    }

    // Calculate risk score for each zone
    const riskScores = await Promise.all(
      zones.map(zone => calculateZoneRiskScore(zone, fromDate, toDate))
    );

    // Sort by risk score (highest first)
    riskScores.sort((a, b) => b.riskScore - a.riskScore);

    return riskScores;
  } catch (error) {
    console.error('Error generating risk map:', error);
    throw error;
  }
};

export const getRiskMapSummary = async (protectedAreaId, from, to) => {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const riskMap = await generateRiskMap(protectedAreaId, fromDate, toDate);

  // Group zones by risk level
  const zonesByRiskLevel = {
    CRITICAL: riskMap.filter(z => z.riskLevel === 'CRITICAL'),
    HIGH: riskMap.filter(z => z.riskLevel === 'HIGH'),
    MEDIUM: riskMap.filter(z => z.riskLevel === 'MEDIUM'),
    LOW: riskMap.filter(z => z.riskLevel === 'LOW')
  };

  // Calculate severity breakdown across all zones
  const severityBreakdown = {
    CRITICAL: riskMap.reduce((sum, z) => sum + (z.severityBreakdown?.critical || 0), 0),
    HIGH: riskMap.reduce((sum, z) => sum + (z.severityBreakdown?.high || 0), 0),
    MEDIUM: riskMap.reduce((sum, z) => sum + (z.severityBreakdown?.medium || 0), 0),
    LOW: riskMap.reduce((sum, z) => sum + (z.severityBreakdown?.low || 0), 0)
  };

  return {
    protectedAreaId,
    zones: riskMap, // All zones sorted by risk score
    zonesByRiskLevel, // Zones grouped by risk level for easy display
    summary: {
      totalZones: riskMap.length,
      criticalZones: zonesByRiskLevel.CRITICAL.length,
      highRiskZones: zonesByRiskLevel.HIGH.length,
      mediumRiskZones: zonesByRiskLevel.MEDIUM.length,
      lowRiskZones: zonesByRiskLevel.LOW.length,
      totalIncidents: riskMap.reduce((sum, z) => sum + z.incidentCount, 0),
      severityBreakdown // Total incidents by severity across all zones
    }
  };
};