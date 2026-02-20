import Incident from '../models/Incident.model.js';
import Zone from '../models/Zone.model.js';
import ProtectedArea from '../models/ProtectedArea.model.js';
import User from '../models/User.js';

// Zone & Protected Area lookups
export const findZoneById = (zoneId) => Zone.findById(zoneId);

export const findProtectedAreaById = (protectedAreaId) =>
  ProtectedArea.findById(protectedAreaId);

// User helpers
export const findAnonymousPublicUser = () =>
  User.findOne({ username: 'anonymous_public', role: 'PUBLIC' });

export const createAnonymousPublicUser = async () => {
  const anonymousUser = new User({
    username: 'anonymous_public',
    email: 'anonymous@public.local',
    password: 'anonymous', // Will be hashed by the User model middleware
    role: 'PUBLIC',
    fullName: 'Anonymous Public User',
    isActive: true
  });

  await anonymousUser.save();
  return anonymousUser;
};

// Incident persistence helpers
export const createIncident = async (incidentData) => {
  const incident = new Incident(incidentData);
  await incident.save();
  return incident;
};

export const paginateIncidents = (query, options) =>
  Incident.paginate(query, options);

export const findActiveIncidentById = (incidentId) =>
  Incident.findOne({
    _id: incidentId,
    isDeleted: false
  });

export const getIncidentWithRelationsById = (incidentId) =>
  Incident.findById(incidentId)
    .populate('reportedBy', 'username email fullName role')
    .populate('verifiedBy', 'username email fullName role')
    .populate('zoneId', 'name')
    .populate('protectedAreaId', 'name');

export const saveIncident = (incident) => incident.save();

