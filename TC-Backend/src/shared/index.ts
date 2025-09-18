// Shared types for frontend consumption
export * from '../types';
export type { AppRouter } from '../routers';

// Re-export tRPC types that the frontend needs
export type { TRPCClientError } from '@trpc/client';

// Export the router type for client-side usage
import type { AppRouter } from '../routers';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

/**
 * Infer the input types for all router procedures
 * Usage: RouterInputs['auth']['syncUser']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Infer the output types for all router procedures
 * Usage: RouterOutputs['content']['search']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Utility types for common patterns
export type TrpcSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total?: number;
    hasMore?: boolean;
  };
};

export type TrpcErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
};

export type TrpcResponse<T> = TrpcSuccessResponse<T> | TrpcErrorResponse;

// Helper type guards
export function isTrpcSuccess<T>(
  response: TrpcResponse<T>
): response is TrpcSuccessResponse<T> {
  return response.success === true;
}

export function isTrpcError<T>(
  response: TrpcResponse<T>
): response is TrpcErrorResponse {
  return response.success === false;
}

// Common error codes
export const TrpcErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type TrpcErrorCode = keyof typeof TrpcErrorCodes;