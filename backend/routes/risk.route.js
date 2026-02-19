import express from 'express';
import * as incidentController from '../controllers/incident.controllers.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRiskMapQuery } from '../validators/incident.validator.js';

const router = express.Router();

/**
 * @swagger
 * /api/risk-map:
 *   get:
 *     summary: Get risk map for a protected area
 *     tags: [Risk Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: protectedAreaId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Risk map data with zone risk scores
 */
router.get(
  '/',
  authenticate,
  validateRiskMapQuery,
  incidentController.getRiskMap
);

export default router;
