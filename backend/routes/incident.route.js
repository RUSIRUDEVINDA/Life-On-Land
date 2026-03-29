import express from 'express';
import * as incidentController from '../controllers/incident.controller.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import {
  validateCreateIncident,
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


router.put(
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
