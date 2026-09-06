const { errorResponse } = require('../utils/response');

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return errorResponse(res, 400, 'Validation failed', details);
    }
    req.body = value;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return errorResponse(res, 400, 'Query validation failed', details);
    }
    req.query = value;
    next();
  };
}

module.exports = {
  validateBody,
  validateQuery,
};
