import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Returns an Express middleware that validates req[part] against a Zod schema.
 * Replaces req[part] with the parsed (coerced) value on success.
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors = (result.error as ZodError).issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ success: false, error: 'Validation failed', details: errors });
      return;
    }

    // Overwrite with coerced/defaults-applied data
    (req as unknown as Record<string, unknown>)[part] = result.data;
    next();
  };
}
