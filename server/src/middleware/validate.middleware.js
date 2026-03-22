/**
 * Zod schema validation middleware factory.
 * Usage: validate(myZodSchema) — validates req.body
 * Usage: validate(myZodSchema, 'query') — validates req.query
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;
    const result = schema.safeParse(data);

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    // Attach parsed (and possibly coerced/defaulted) data back to request
    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req.validatedBody = result.data;
    }

    next();
  };
};
