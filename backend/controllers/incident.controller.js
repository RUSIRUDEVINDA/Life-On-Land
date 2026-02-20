import * as incidentService from '../services/incident.service.js';
import * as riskService from '../services/risk.service.js';

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

export const getIncidents = async (req, res, next) => {
  try {
    const result = await incidentService.getIncidents(req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};
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

export const getRiskMap = async (req, res, next) => {
  try {
    const { protectedAreaId, from, to } = req.query;

    const riskMapSummary = await riskService.getRiskMapSummary(
      protectedAreaId,
      from,
      to
    );

    res.status(200).json({
      success: true,
      data: riskMapSummary
    });
  } catch (error) {
    next(error);
  }
};
