import express from 'express';
import * as incidentController from '../controllers/incident.controller.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import {
  validateCreateIncident,
  validateFullUpdateIncident,
  validateUpdateIncident,
  validateGetIncidentsQuery
} from '../validators/incident.validator.js';

const router = express.Router();


router.post(
  '/',
  optionalAuth,
  validateCreateIncident,
  incidentController.createIncident
);

router.get(
  '/',
  authenticate,
  validateGetIncidentsQuery,
  incidentController.getIncidents
);


router.get(
  '/:id',
  authenticate,
  incidentController.getIncidentById
);


// PUT endpoint - Full update (requires all fields)
router.put(
  '/:id',
  authenticate,
  authorize('RANGER', 'OFFICER', 'Admin'),
  validateFullUpdateIncident,
  incidentController.updateIncident
);

// PATCH endpoint - Partial update (allows any subset of fields)
router.patch(
  '/:id',
  authenticate,
  authorize('RANGER', 'OFFICER', 'Admin'),
  validateUpdateIncident,
  incidentController.updateIncident
);


router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  incidentController.deleteIncident
);


export default router;
