import Incident from '../models/Incident.model.js';
import Zone from '../models/Zone.models.js';
import ProtectedArea from '../models/ProtectedArea.models.js';
import User from '../models/User.js';

// Zone & Protected Area lookups
export const findZoneById = (zoneId) => Zone.findById(zoneId);

export const findProtectedAreaById = (protectedAreaId) =>
  ProtectedArea.findById(protectedAreaId);

// User helpers
export const findAnonymousPublicUser = () =>
  User.findOne({ email: 'anonymous@public.local', role: 'RANGER' });

export const createAnonymousPublicUser = async () => {
  const anonymousUser = new User({
    name: 'Anonymous Public User',
    email: 'anonymous@public.local',
    password: 'anonymous', // Will be hashed by the User model middleware
    role: 'RANGER'
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
    .populate('reportedBy', 'name email role')
    .populate('verifiedBy', 'name email role')
    .populate('zoneId', 'name')
    .populate('protectedAreaId', 'name');

export const saveIncident = (incident) => incident.save();

