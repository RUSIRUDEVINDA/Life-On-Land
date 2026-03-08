import Incident from '../models/Incident.model.js';
import Zone from '../models/Zone.model.js';
import ProtectedArea from '../models/ProtectedArea.model.js';
import User from '../models/User.js';

// Zone & Protected Area lookups
const findZoneById = (zoneId) => Zone.findById(zoneId);

const findProtectedAreaById = (protectedAreaId) =>
  ProtectedArea.findById(protectedAreaId);

// User helpers
const findAnonymousPublicUser = () =>
  User.findOne({ email: 'anonymous@public.local', role: 'RANGER' });

const createAnonymousPublicUser = async () => {
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
const createIncident = async (incidentData) => {
  const incident = new Incident(incidentData);
  await incident.save();
  return incident;
};

const paginateIncidents = (query, options) =>
  Incident.paginate(query, options);

const findActiveIncidentById = (incidentId) =>
  Incident.findOne({
    _id: incidentId,
    isDeleted: false
  });

const findById = (incidentId) =>
  Incident.findById(incidentId)
    .populate('reportedBy', 'name email role')
    .populate('verifiedBy', 'name email role')
    .populate('zoneId', 'name')
    .populate('protectedAreaId', 'name');

const saveIncident = (incident) => incident.save();

// Default export — sinon can stub properties on this object
const incidentRepo = {
  findZoneById,
  findProtectedAreaById,
  findAnonymousPublicUser,
  createAnonymousPublicUser,
  createIncident,
  paginateIncidents,
  findActiveIncidentById,
  findById,
  saveIncident,
};

export default incidentRepo;