// Search controller - Request/response handling for global search
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as searchService from './search.service';
import type { SearchQueryDto } from './search.dtos';

/**
 * GET /api/search
 * Global search across all entities
 * Requires authentication
 */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as SearchQueryDto;

  if (!query.q || typeof query.q !== 'string') {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }

  const limit = query.limit ? parseInt(String(query.limit), 10) : 10;
  if (limit < 1 || limit > 50) {
    res.status(400).json({ error: 'Limit must be between 1 and 50' });
    return;
  }

  let types: Array<'student' | 'teacher' | 'subject' | 'group'> | undefined;
  if (query.types) {
    if (typeof query.types === 'string') {
      types = [query.types as 'student' | 'teacher' | 'subject' | 'group'];
    } else if (Array.isArray(query.types)) {
      types = query.types as Array<'student' | 'teacher' | 'subject' | 'group'>;
    }
  }

  const result = await searchService.globalSearch({
    q: query.q,
    limit,
    types,
  });

  res.json(result);
});

