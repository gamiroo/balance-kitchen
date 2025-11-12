// lib/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    [key: string]: string | number | boolean | object | null | undefined;
  };
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  meta?: {
    count: number;
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    timestamp: string;
    [key: string]: string | number | boolean | object | null | undefined;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    [key: string]: string | number | boolean | object | null | undefined;
  };
}
