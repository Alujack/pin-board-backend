export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ResponseUtil {
  static success<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return {
      success: true,
      message,
      data
    };
  }

  static successWithPagination<T>(
    data: T[],
    pagination: PaginationInfo,
    message: string = 'Success'
  ): ApiResponse<T[]> {
    return {
      success: true,
      message,
      data,
      pagination
    };
  }

  static error(message: string, error?: string): ApiResponse {
    return {
      success: false,
      message,
      error
    };
  }

  static created<T>(data: T, message: string = 'Resource created successfully'): ApiResponse<T> {
    return {
      success: true,
      message,
      data
    };
  }

  static updated<T>(data: T, message: string = 'Resource updated successfully'): ApiResponse<T> {
    return {
      success: true,
      message,
      data
    };
  }

  static deleted(message: string = 'Resource deleted successfully'): ApiResponse {
    return {
      success: true,
      message
    };
  }

  static notFound(message: string = 'Resource not found'): ApiResponse {
    return {
      success: false,
      message
    };
  }

  static unauthorized(message: string = 'Unauthorized'): ApiResponse {
    return {
      success: false,
      message
    };
  }

  static forbidden(message: string = 'Forbidden'): ApiResponse {
    return {
      success: false,
      message
    };
  }

  static conflict(message: string = 'Conflict'): ApiResponse {
    return {
      success: false,
      message
    };
  }

  static validationError(message: string, error?: string): ApiResponse {
    return {
      success: false,
      message,
      error
    };
  }
}
