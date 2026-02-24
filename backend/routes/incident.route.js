import express from 'express';
import * as incidentController from '../controllers/incident.controller.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import {
  validateCreateIncident,
  validateUpdateIncident,
  validateGetIncidentsQuery
} from '../validators/incident.validator.js';

const router = express.Router();

/**
 * @swagger
 * /api/incidents:
 *   post:
 *     summary: Create a new incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - description
 *               - zoneId
 *               - protectedAreaId
 *               - incidentDate
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [POACHING, ILLEGAL_LOGGING, WILDLIFE_TRADE, HABITAT_DESTRUCTION, OTHER]
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *                 description: Optional location coordinates
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [81.3667, 6.2833]
 *               zoneId:
 *                 type: string
 *               protectedAreaId:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               incidentDate:
 *                 type: string
 *                 format: date-time
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Incident created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  optionalAuth,
  validateCreateIncident,
  incidentController.createIncident
);

/**
 * @swagger
 * /api/incidents:
 *   get:
 *     summary: Get incidents with filters and pagination
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: protectedAreaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: zoneId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [POACHING, ILLEGAL_LOGGING, WILDLIFE_TRADE, HABITAT_DESTRUCTION, OTHER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REPORTED, VERIFIED, INVESTIGATING, RESOLVED, UNVERIFIED]
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of incidents
 */
router.get(
  '/',
  authenticate,
  validateGetIncidentsQuery,
  incidentController.getIncidents
);

/**
 * @swagger
 * /api/incidents/{id}:
 *   get:
 *     summary: Get incident by ID
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Incident details
 *       404:
 *         description: Incident not found
 */
router.get(
  '/:id',
  authenticate,
  incidentController.getIncidentById
);

/**
 * @swagger
 * /api/incidents/{id}:
 *   put:
 *     summary: Update incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [REPORTED, VERIFIED, INVESTIGATING, RESOLVED, UNVERIFIED]
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               zoneId:
 *                 type: string
 *               description:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Incident updated successfully
 *       403:
 *         description: Insufficient permissions
 */
router.put(
  '/:id',
  authenticate,
  authorize('RANGER', 'OFFICER', 'Admin'),
  validateUpdateIncident,
  incidentController.updateIncident
);

/**
 * @swagger
 * /api/incidents/{id}:
 *   delete:
 *     summary: Soft delete incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Incident deleted successfully
 *       403:
 *         description: Insufficient permissions
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  incidentController.deleteIncident
);


export default router;
