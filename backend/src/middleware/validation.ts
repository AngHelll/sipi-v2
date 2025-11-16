// Validation middleware using express-validator
import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, param } from 'express-validator';

/**
 * Middleware to check validation results
 * Must be called after validation chains
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Error de validación',
      details: errors.array(),
    });
    return;
  }
  next();
};

/**
 * Run multiple validation chains
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Error de validación',
        details: errors.array(),
      });
      return;
    }
    next();
  };
};

/**
 * Validate UUID parameter
 */
export const validateUUID = (paramName: string = 'id') => {
  return param(paramName)
    .isUUID()
    .withMessage(`${paramName} debe ser un UUID válido`);
};

