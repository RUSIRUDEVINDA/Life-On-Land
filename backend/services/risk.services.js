import Incident from '../models/Incident.model.js';
import Zone from '../models/Zone.model.js';
import { getWeatherData } from './weather.services.js';

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

    // 4. Average severity (weight: LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4)
    const severityWeights = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    if (incidents.length > 0) {
      const avgSeverity = incidents.reduce((sum, inc) => 
        sum + (severityWeights[inc.severity] || 2), 0
      ) / incidents.length;
      baseScore += avgSeverity * 5; // Max 20 points
    }

    // 5. Unverified incidents increase risk
    const unverifiedCount = incidents.filter(inc => inc.status === 'UNVERIFIED').length;
    baseScore += unverifiedCount * 3;

    // 6. Weather-based multiplier
    const [lon, lat] = zone.location.coordinates;
    const weatherData = await getWeatherData(lat, lon);
    const weatherMultiplier = weatherData.multiplier || 1.0;

    // Calculate final risk score (0-100 scale)
    const finalScore = Math.min(100, Math.round(baseScore * weatherMultiplier));

    // Determine risk level
    let riskLevel = 'LOW';
    if (finalScore >= 70) riskLevel = 'CRITICAL';
    else if (finalScore >= 50) riskLevel = 'HIGH';
    else if (finalScore >= 30) riskLevel = 'MEDIUM';

    return {
      zoneId: zone._id,
      zoneName: zone.name,
      riskScore: finalScore,
      riskLevel,
      baseScore: Math.round(baseScore),
      weatherMultiplier: weatherMultiplier.toFixed(2),
      weatherCondition: weatherData.condition,
      incidentCount: totalIncidents,
      recentIncidentCount: recentIncidents.length,
      veryRecentIncidentCount: veryRecentIncidents.length,
      averageSeverity: incidents.length > 0 
        ? Object.keys(severityWeights).find(key => 
            severityWeights[key] === Math.round(
              incidents.reduce((sum, inc) => sum + (severityWeights[inc.severity] || 2), 0) / incidents.length
            )
          ) || 'MEDIUM'
        : 'N/A',
      unverifiedCount,
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
    // Get all active zones in the protected area
    const zones = await Zone.find({
      protectedAreaId,
      isActive: true
    });

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

  return {
    protectedAreaId,
    dateRange: {
      from: from || null,
      to: to || null
    },
    zones: riskMap,
    summary: {
      totalZones: riskMap.length,
      criticalZones: riskMap.filter(z => z.riskLevel === 'CRITICAL').length,
      highRiskZones: riskMap.filter(z => z.riskLevel === 'HIGH').length,
      mediumRiskZones: riskMap.filter(z => z.riskLevel === 'MEDIUM').length,
      lowRiskZones: riskMap.filter(z => z.riskLevel === 'LOW').length
    }
  };
};