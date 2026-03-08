import * as incidentRepository from '../repositories/incident.repository.js';
import * as alertService from './alert.service.js';
import Incident from '../models/Incident.model.js';

/**
 * Create a new incident
 * @param {Object} incidentData - Incident data
 * @param {Object} user - User creating the incident (can be undefined for public)
 * @returns {Promise<Object>} Created incident
 */
export const createIncident = async (incidentData, user) => {
  // Verify zone and protected area exist
  const zone = await incidentRepository.findZoneById(incidentData.zoneId);
  if (!zone || zone.status !== 'ACTIVE') {
    throw new Error('Zone not found or inactive');
  }

  const protectedArea = await incidentRepository.findProtectedAreaById(
    incidentData.protectedAreaId
  );
  if (!protectedArea || protectedArea.status !== 'ACTIVE') {
    throw new Error('Protected area not found or inactive');
  }

  // Verify zone belongs to protected area
  if (zone.protectedAreaId.toString() !== incidentData.protectedAreaId.toString()) {
    throw new Error('Zone does not belong to the specified protected area');
  }

  // Handle unauthenticated users (PUBLIC access)
  let reportingUser = user;
  if (!user) {
    // Create or find anonymous public user for unauthenticated reports
    let anonymousUser = await incidentRepository.findAnonymousPublicUser();
    if (!anonymousUser) {
      anonymousUser = await incidentRepository.createAnonymousPublicUser();
    }
    reportingUser = anonymousUser;
  }

  // Set status based on user role
  let status = incidentData.status || 'REPORTED';
  if (!user || reportingUser.role === 'PUBLIC') {
    status = 'UNVERIFIED';
  }

  const incidentToCreate = {
    ...incidentData,
    status,
    reportedBy: reportingUser._id
  };

  // Only set location if it's provided
  if (incidentData.location && incidentData.location.coordinates) {
    incidentToCreate.location = {
      type: 'Point',
      coordinates: incidentData.location.coordinates
    };
  }

  const incident = await incidentRepository.createIncident(incidentToCreate);

  // Trigger incident alert
  await alertService.triggerIncidentAlert(incident, zone.name);

  return await incidentRepository.getIncidentWithRelationsById(incident._id);
};

/**
 * Get incidents with filters and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} Paginated incidents
 */
export const getIncidents = async (filters = {}, pagination = {}) => {
  const {
    protectedAreaId,
    zoneId,
    type,
    status,
    from,
    to,
    page = 1,
    limit = 10,
    sortBy = 'incidentDate',
    sortOrder = 'desc'
  } = { ...filters, ...pagination };

  const query = { isDeleted: false };

  if (protectedAreaId) query.protectedAreaId = protectedAreaId;
  if (zoneId) query.zoneId = zoneId;
  if (type) query.type = type;
  if (status) query.status = status;

  if (from || to) {
    query.incidentDate = {};
    if (from) query.incidentDate.$gte = new Date(from);
    if (to) query.incidentDate.$lte = new Date(to);
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: 'reportedBy', select: 'username email fullName role' },
      { path: 'verifiedBy', select: 'username email fullName role' },
      { path: 'zoneId', select: 'name' },
      { path: 'protectedAreaId', select: 'name' }
    ]
  };

  const result = await incidentRepository.paginateIncidents(query, options);

  return {
    data: result.docs,
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage
    }
  };
};

/**
 * Get incident by ID
 * @param {string} incidentId - Incident ID
 * @returns {Promise<Object>} Incident
 */
export const getIncidentById = async (incidentId) => {
  const incident = await incidentRepository.findActiveIncidentById(incidentId);

  if (!incident) {
    throw new Error('Incident not found');
  }

  return await incidentRepository.getIncidentWithRelationsById(incident._id);
};

/**
 * Update incident
 * @param {string} incidentId - Incident ID
 * @param {Object} updateData - Update data
 * @param {Object} user - User making the update
 * @returns {Promise<Object>} Updated incident
 */
export const updateIncident = async (incidentId, updateData, user) => {
  const incident = await incidentRepository.findActiveIncidentById(incidentId);

  if (!incident) {
    throw new Error('Incident not found');
  }

  // Role-based update restrictions
  if (user.role === 'PUBLIC') {
    throw new Error('Public users cannot update incidents');
  }

  // Only Admin and OFFICER can change status to VERIFIED
  if (updateData.status === 'VERIFIED' && !['Admin', 'OFFICER'].includes(user.role)) {
    throw new Error('Only Admin and OFFICER can verify incidents');
  }

  // If verifying, set verifiedBy and verifiedAt
  if (updateData.status === 'VERIFIED' && incident.status !== 'VERIFIED') {
    updateData.verifiedBy = user._id;
    updateData.verifiedAt = new Date();
  }

  // If updating zone, verify it exists and belongs to the same protected area
  if (updateData.zoneId) {
    const zone = await incidentRepository.findZoneById(updateData.zoneId);
    if (!zone || zone.status !== 'ACTIVE') {
      throw new Error('Zone not found or inactive');
    }
    if (zone.protectedAreaId.toString() !== incident.protectedAreaId.toString()) {
      throw new Error('Zone must belong to the same protected area');
    }
  }

  // Update location if coordinates are provided
  if (updateData.location && updateData.location.coordinates) {
    updateData.location = {
      type: 'Point',
      coordinates: updateData.location.coordinates
    };
  }

  Object.assign(incident, updateData);
  await incidentRepository.saveIncident(incident);

  return await incidentRepository.getIncidentWithRelationsById(incident._id);
};


export const deleteIncident = async (incidentId, user) => {
  // Only Admin can delete incidents (case-insensitive check)
  const userRole = user.role?.toUpperCase();
  if (userRole !== 'ADMIN') {
    throw new Error('Only Admin can delete incidents');
  }

  try {
    // First verify the incident exists
    const existingIncident = await Incident.findById(incidentId);

    if (!existingIncident) {
      throw new Error('Incident not found');
    }

    // Hard delete - actually remove the document from the database
    const deleteResult = await Incident.findByIdAndDelete(incidentId);

    if (!deleteResult) {
      throw new Error('Failed to delete incident - document was not removed from database');
    }

    return deleteResult;
  } catch (error) {
    console.error('Error deleting incident:', error);
    throw error;
  }
};