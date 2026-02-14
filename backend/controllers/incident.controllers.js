import * as incidentService from '../services/incidentService.services.js';
import * as riskService from '../services/riskService.services.js';

/**
 * Create a new incident
 * POST /api/incidents
 */
export const createIncident = async (req, res, next) => {
  try {
    const incident = await incidentService.createIncident(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get incidents with filters and pagination
 * GET /api/incidents
 */
export const getIncidents = async (req, res, next) => {
  try {
    const result = await incidentService.getIncidents(req.query);
    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalDocs: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get incident by ID
 * GET /api/incidents/:id
 */
export const getIncidentById = async (req, res, next) => {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);
    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update incident
 * PUT /api/incidents/:id
 */
export const updateIncident = async (req, res, next) => {
  try {
    const incident = await incidentService.updateIncident(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Incident updated successfully',
      data: incident
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete incident (soft delete)
 * DELETE /api/incidents/:id
 */
export const deleteIncident = async (req, res, next) => {
  try {
    await incidentService.deleteIncident(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Incident deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get risk map for a protected area
 * GET /api/risk-map
 */
export const getRiskMap = async (req, res, next) => {
  try {
    const { protectedAreaId, from, to } = req.query;
    
    const riskMap = await riskService.generateRiskMap(
      protectedAreaId,
      from ? new Date(from) : null,
      to ? new Date(to) : null
    );

    res.status(200).json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};
