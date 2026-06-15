import { groupsApi } from './api';
import { getCached } from './requestCache';

const PERIODS_CACHE_KEY = 'unique-group-periods';
const PERIODS_CACHE_TTL_MS = 5 * 60 * 1000;

/** Unique group periods; cached 5 min to avoid re-scanning all pages on every form/list mount. */
export async function fetchUniqueGroupPeriods(): Promise<string[]> {
  return getCached(PERIODS_CACHE_KEY, PERIODS_CACHE_TTL_MS, async () => {
    const allPeriods: string[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await groupsApi.getAll({ limit: 100, page });
      const periodos = response.groups.map((g) => g.periodo).filter(Boolean) as string[];
      allPeriods.push(...periodos);
      hasMore = page < response.pagination.totalPages;
      page += 1;
    }

    return [...new Set(allPeriods)].sort().reverse();
  });
}
