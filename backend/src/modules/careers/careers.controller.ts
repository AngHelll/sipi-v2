import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as careersService from './careers.service';
import { CareerQueryDto } from './careers.dtos';

/**
 * GET /api/careers
 * List careers for catalogs (student form, filters)
 */
export const getAllCareers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as CareerQueryDto;
  const result = await careersService.getAllCareers(query);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(result);
});
