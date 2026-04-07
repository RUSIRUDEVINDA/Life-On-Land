import bcrypt from 'bcryptjs';
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
  User.findOne({ email: 'anonymous@public.local', role: 'RANGER' });

export const createAnonymousPublicUser = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('anonymous-unused', salt);
  const anonymousUser = new User({
    name: 'Anonymous Public User',
    email: 'anonymous@public.local',
    phone: '+94700000001',
    password: hashedPassword,
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

export const findById = (incidentId) =>
  Incident.findById(incidentId)
    .populate('reportedBy', 'name email role')
    .populate('verifiedBy', 'name email role')
    .populate('zoneId', 'name')
    .populate('protectedAreaId', 'name');

export const saveIncident = (incident) => incident.save();

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