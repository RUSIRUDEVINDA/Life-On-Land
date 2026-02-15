import Joi from 'joi';

const severityEnum = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statusEnum = ['REPORTED', 'VERIFIED', 'INVESTIGATING', 'RESOLVED', 'UNVERIFIED'];
const typeEnum = ['POACHING', 'ILLEGAL_LOGGING', 'WILDLIFE_TRADE', 'HABITAT_DESTRUCTION', 'OTHER'];

export const createIncidentSchema = Joi.object({
  type: Joi.string().valid(...typeEnum).required()
    .messages({
      'any.only': 'Type must be one of: POACHING, ILLEGAL_LOGGING, WILDLIFE_TRADE, HABITAT_DESTRUCTION, OTHER',
      'any.required': 'Type is required'
    }),
  description: Joi.string().trim().required().min(10).max(5000)
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 5000 characters'
    }),
  location: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
      .messages({
        'array.length': 'Coordinates must be [longitude, latitude]',
        'any.required': 'Coordinates are required'
      })
  }).required(),
  zoneId: Joi.string().hex().length(24).required()
    .messages({
      'string.hex': 'Zone ID must be a valid MongoDB ObjectId',
      'string.length': 'Zone ID must be 24 characters',
      'any.required': 'Zone ID is required'
    }),
  protectedAreaId: Joi.string().hex().length(24).required()
    .messages({
      'string.hex': 'Protected Area ID must be a valid MongoDB ObjectId',
      'string.length': 'Protected Area ID must be 24 characters',
      'any.required': 'Protected Area ID is required'
    }),
  severity: Joi.string().valid(...severityEnum).default('MEDIUM')
    .messages({
      'any.only': 'Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL'
    }),
  incidentDate: Joi.date().max('now').required()
    .messages({
      'date.max': 'Incident date cannot be in the future',
      'any.required': 'Incident date is required'
    }),
  evidence: Joi.array().items(Joi.string().uri()).optional()
    .messages({
      'string.uri': 'Evidence must be a valid URL'
    }),
  notes: Joi.string().trim().max(1000).optional()
});

export const updateIncidentSchema = Joi.object({
  status: Joi.string().valid(...statusEnum).optional()
    .messages({
      'any.only': 'Status must be one of: REPORTED, VERIFIED, INVESTIGATING, RESOLVED, UNVERIFIED'
    }),
  severity: Joi.string().valid(...severityEnum).optional()
    .messages({
      'any.only': 'Severity must be one of: LOW, MEDIUM, HIGH, CRITICAL'
    }),
  zoneId: Joi.string().hex().length(24).optional()
    .messages({
      'string.hex': 'Zone ID must be a valid MongoDB ObjectId',
      'string.length': 'Zone ID must be 24 characters'
    }),
  description: Joi.string().trim().min(10).max(5000).optional(),
  evidence: Joi.array().items(Joi.string().uri()).optional(),
  notes: Joi.string().trim().max(1000).optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const getIncidentsQuerySchema = Joi.object({
  protectedAreaId: Joi.string().hex().length(24).optional(),
  zoneId: Joi.string().hex().length(24).optional(),
  type: Joi.string().valid(...typeEnum).optional(),
  status: Joi.string().valid(...statusEnum).optional(),
  from: Joi.date().optional(),
  to: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('incidentDate', 'createdAt', 'severity').default('incidentDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
}).custom((value, helpers) => {
  if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
    return helpers.error('date.range', { from: value.from, to: value.to });
  }
  return value;
}).messages({
  'date.range': 'From date must be before or equal to To date'
});

export const riskMapQuerySchema = Joi.object({
  protectedAreaId: Joi.string().hex().length(24).required()
    .messages({
      'any.required': 'Protected Area ID is required'
    }),
  from: Joi.date().optional(),
  to: Joi.date().optional()
}).custom((value, helpers) => {
  if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
    return helpers.error('date.range');
  }
  return value;
}).messages({
  'date.range': 'From date must be before or equal to To date'
});
