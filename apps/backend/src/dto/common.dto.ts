export interface ApiErrorResponse {
  message: string;
}

export interface MessageResponse {
  message: string;
}

export interface SuccessResponse {
  success: true;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}
