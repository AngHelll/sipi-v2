// DTOs for global search module
export interface SearchResultItem {
  type: 'student' | 'teacher' | 'subject' | 'group';
  id: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponseDto {
  results: SearchResultItem[];
  total: number;
  query: string;
}

export interface SearchQueryDto {
  q: string;
  limit?: number;
  types?: Array<'student' | 'teacher' | 'subject' | 'group'>;
}

