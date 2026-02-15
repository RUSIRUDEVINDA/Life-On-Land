import Incident from '../models/Incident.models.js';
import Zone from '../models/Zone.models.js';
import ProtectedArea from '../models/ProtectedArea.models.js';

import User from '../models/User.models.js';

/**
 * Create a new incident
 * @param {Object} incidentData - Incident data
 * @param {Object} user - User creating the incident (can be undefined for public)
 * @returns {Promise<Object>} Created incident
 */
export const createIncident = async (incidentData, user) => {
  // Verify zone and protected area exist
  const zone = await Zone.findById(incidentData.zoneId);
  if (!zone || !zone.isActive) {
    throw new Error('Zone not found or inactive');
  }

  const protectedArea = await ProtectedArea.findById(incidentData.protectedAreaId);
  if (!protectedArea || !protectedArea.isActive) {
    throw new Error('Protected area not found or inactive');
  }

  // Verify zone belongs to protected area
  if (zone.protectedAreaId.toString() !== incidentData.protectedAreaId) {
    throw new Error('Zone does not belong to the specified protected area');
  }

  // Handle unauthenticated users (PUBLIC access)
  let reportingUser = user;
  if (!user) {
    // Create or find anonymous public user for unauthenticated reports
    let anonymousUser = await User.findOne({ username: 'anonymous_public', role: 'PUBLIC' });
    if (!anonymousUser) {
      anonymousUser = new User({
        username: 'anonymous_public',
        email: 'anonymous@public.local',
        password: 'anonymous', // Will be hashed
        role: 'PUBLIC',
        fullName: 'Anonymous Public User',
        isActive: true
      });
      await anonymousUser.save();
    }
    reportingUser = anonymousUser;
  }

  // Set status based on user role
  let status = incidentData.status || 'REPORTED';
  if (!user || reportingUser.role === 'PUBLIC') {
    status = 'UNVERIFIED';
  }

  const incident = new Incident({
    ...incidentData,
    status,
    reportedBy: reportingUser._id,
    location: {
      type: 'Point',
      coordinates: incidentData.location.coordinates
    }
  });

  await incident.save();
  return await Incident.findById(incident._id)
    .populate('reportedBy', 'username email fullName role')
    .populate('zoneId', 'name')
    .populate('protectedAreaId', 'name');
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

  const result = await Incident.paginate(query, options);
  return result;
};

/**
 * Get incident by ID
 * @param {string} incidentId - Incident ID
 * @returns {Promise<Object>} Incident
 */
export const getIncidentById = async (incidentId) => {
  const incident = await Incident.findOne({
    _id: incidentId,
    isDeleted: false
  })
    .populate('reportedBy', 'username email fullName role')
    .populate('verifiedBy', 'username email fullName role')
    .populate('zoneId', 'name')
    .populate('protectedAreaId', 'name');

  if (!incident) {
    throw new Error('Incident not found');
  }

  return incident;
};

/**
 * Update incident
 * @param {string} incidentId - Incident ID
 * @param {Object} updateData - Update data
 * @param {Object} user - User making the update
 * @returns {Promise<Object>} Updated incident
 */
export const updateIncident = async (incidentId, updateData, user) => {
  const incident = await Incident.findOne({
    _id: incidentId,
    isDeleted: false
  });

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
    const zone = await Zone.findById(updateData.zoneId);
    if (!zone || !zone.isActive) {
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
  await incident.save();

  return await Incident.findById(incident._id)
    .populate('reportedBy', 'username email fullName role')
    .populate('verifiedBy', 'username email fullName role')
    .populate('zoneId', 'name')
    .populate('protectedAreaId', 'name');
};

/**
 * Soft delete incident
 * @param {string} incidentId - Incident ID
 * @param {Object} user - User deleting the incident
 * @returns {Promise<Object>} Deleted incident
 */
export const deleteIncident = async (incidentId, user) => {
  const incident = await Incident.findOne({
    _id: incidentId,
    isDeleted: false
  });

  if (!incident) {
    throw new Error('Incident not found');
  }

  // Only Admin and OFFICER can delete incidents
  if (!['Admin', 'OFFICER'].includes(user.role)) {
    throw new Error('Only Admin and OFFICER can delete incidents');
  }

  incident.isDeleted = true;
  incident.deletedAt = new Date();
  incident.deletedBy = user._id;

  await incident.save();
  return incident;
};
