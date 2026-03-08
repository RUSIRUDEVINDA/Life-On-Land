import incidentRepository from '../repositories/incident.repository.js';
import * as alertService from './alert.service.js';

/**
 * Create a new incident
 */
export const createIncident = async (incidentData, user) => {
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

  if (zone.protectedAreaId.toString() !== incidentData.protectedAreaId.toString()) {
    throw new Error('Zone does not belong to the specified protected area');
  }

  let reportingUser = user;
  if (!user) {
    let anonymousUser = await incidentRepository.findAnonymousPublicUser();
    if (!anonymousUser) {
      anonymousUser = await incidentRepository.createAnonymousPublicUser();
    }
    reportingUser = anonymousUser;
  }

  let status = incidentData.status || 'REPORTED';
  if (!user || reportingUser.role === 'PUBLIC') {
    status = 'UNVERIFIED';
  }

  const incidentToCreate = {
    ...incidentData,
    status,
    reportedBy: reportingUser._id
  };

  if (incidentData.location && incidentData.location.coordinates) {
    incidentToCreate.location = {
      type: 'Point',
      coordinates: incidentData.location.coordinates
    };
  }

  const incident = await incidentRepository.createIncident(incidentToCreate);

  await alertService.triggerIncidentAlert(incident, zone.name);

  return await incidentRepository.findById(incident._id);
};

/**
 * Get incidents with filters and pagination
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
 */
export const getIncidentById = async (incidentId) => {
  const incident = await incidentRepository.findById(incidentId);

  if (!incident) {
    const error = new Error('Incident not found');
    error.statusCode = 404;
    throw error;
  }

  return incident;
};

/**
 * Update incident
 */
export const updateIncident = async (incidentId, updateData, user) => {
  const incident = await incidentRepository.findActiveIncidentById(incidentId);

  if (!incident) {
    throw new Error('Incident not found');
  }

  if (user.role === 'PUBLIC') {
    throw new Error('Public users cannot update incidents');
  }

  if (updateData.status === 'VERIFIED' && !['Admin', 'OFFICER'].includes(user.role)) {
    throw new Error('Only Admin and OFFICER can verify incidents');
  }

  if (updateData.status === 'VERIFIED' && incident.status !== 'VERIFIED') {
    updateData.verifiedBy = user._id;
    updateData.verifiedAt = new Date();
  }

  if (updateData.zoneId) {
    const zone = await incidentRepository.findZoneById(updateData.zoneId);
    if (!zone || zone.status !== 'ACTIVE') {
      throw new Error('Zone not found or inactive');
    }
    if (zone.protectedAreaId.toString() !== incident.protectedAreaId.toString()) {
      throw new Error('Zone must belong to the same protected area');
    }
  }

  if (updateData.location && updateData.location.coordinates) {
    updateData.location = {
      type: 'Point',
      coordinates: updateData.location.coordinates
    };
  }

  Object.assign(incident, updateData);
  await incidentRepository.saveIncident(incident);

  return await incidentRepository.findById(incident._id);
};

/**
 * Soft delete incident
 */
export const deleteIncident = async (incidentId, user) => {
  const incident = await incidentRepository.findActiveIncidentById(incidentId);

  if (!incident) {
    throw new Error('Incident not found');
  }

  if (!['ADMIN', 'OFFICER'].includes(user.role)) {
    throw new Error('Only Admin and OFFICER can delete incidents');
  }

  incident.isDeleted = true;
  incident.deletedAt = new Date();
  incident.deletedBy = user._id;

  await incidentRepository.saveIncident(incident);
  return incident;
};