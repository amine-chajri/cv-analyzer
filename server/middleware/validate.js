/**
 * Zod body-validation middleware factory.
 * On success, replaces req.body with the parsed (coerced/cleaned) data.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const first = result.error.issues[0];
    const field = first?.path?.join('.') || '';
    return res.status(400).json({
      success: false,
      message: first ? `${field ? field + ': ' : ''}${first.message}` : 'Invalid request body',
    });
  }
  req.body = result.data;
  next();
};

module.exports = validate;
