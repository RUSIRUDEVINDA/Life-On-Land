import express from 'express';
import * as incidentController from '../controllers/incident.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRiskMapQuery } from '../validators/incident.validator.js';

const router = express.Router();

router.get(
  '/',
  authenticate,
  validateRiskMapQuery,
  incidentController.getRiskMap
);

export default router;
