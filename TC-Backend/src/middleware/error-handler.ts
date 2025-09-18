/**
 * Error Handling Middleware
 *
 * Centralized error handling for the TCWatch API.
 * Provides consistent error responses, logging, and monitoring integration.
 */

import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { RepositoryError } from '../services/base/repository.js';

// Error types
export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
    timestamp: string;
    path?: string;
  };
}

export interface ErrorContext {
  userId?: string;
  requestId: string;
  userAgent?: string;
  ip?: string;
  method: string;
  url: string;
  body?: any;
  query?: any;
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string, public service: string, public originalError?: Error) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export class BusinessLogicError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Error Logger
 */
class ErrorLogger {
  private static instance: ErrorLogger;

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error, context: ErrorContext, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      },
      context,
      environment: process.env.NODE_ENV
    };

    // Console logging (development)
    if (process.env.NODE_ENV === 'development') {
      console.error('🔥 Error occurred:', logEntry);
    }

    // Production logging would integrate with services like:
    // - Sentry for error tracking
    // - DataDog or New Relic for monitoring
    // - CloudWatch for AWS deployments
    this.sendToExternalServices(logEntry, severity);
  }

  private sendToExternalServices(logEntry: any, severity: string): void {
    // Integration points for production error reporting
    if (process.env.NODE_ENV === 'production') {
      // Example integrations:
      // await this.sendToSentry(logEntry);
      // await this.sendToDataDog(logEntry);
      // await this.sendToSlack(logEntry, severity);
    }
  }

  private async sendToSentry(logEntry: any): Promise<void> {
    // Sentry integration would go here
    // Sentry.captureException(error, { extra: context });
  }

  private async sendToDataDog(logEntry: any): Promise<void> {
    // DataDog integration would go here
  }

  private async sendToSlack(logEntry: any, severity: string): Promise<void> {
    // Slack notification for critical errors
    if (severity === 'critical') {
      // Send Slack webhook
    }
  }
}

/**
 * Error Response Builder
 */
class ErrorResponseBuilder {
  static build(error: Error, context: ErrorContext): ErrorResponse {
    const baseResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        path: context.url
      }
    };

    // Handle different error types
    if (error instanceof ValidationError) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: {
            field: error.field,
            value: error.value
          }
        }
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: 'AUTHENTICATION_ERROR',
          message: error.message
        }
      };
    }

    if (error instanceof AuthorizationError) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: 'AUTHORIZATION_ERROR',
          message: error.message
        }
      };
    }

    if (error instanceof RateLimitError) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: 'RATE_LIMIT_ERROR',
          message: error.message,
          details: {
            retryAfter: error.retryAfter
          }
        }
      };
    }

    if (error instanceof ExternalServiceError) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: 'EXTERNAL_SERVICE_ERROR',
          message: `External service error: ${error.service}`,
          details: {
            service: error.service,
            originalMessage: error.message
          }
        }
      };
    }

    if (error instanceof BusinessLogicError) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: error.code || 'BUSINESS_LOGIC_ERROR',
          message: error.message
        }
      };
    }

    if (error instanceof RepositoryError) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: error.code,
          message: error.message,
          details: error.meta
        }
      };
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.buildPrismaErrorResponse(error, baseResponse);
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: 'VALIDATION_ERROR',
          message: 'Invalid data provided'
        }
      };
    }

    // Handle tRPC errors
    if (error instanceof TRPCError) {
      return this.buildTRPCErrorResponse(error, baseResponse);
    }

    // Handle Fastify errors
    if ('statusCode' in error) {
      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          code: (error as any).code || 'HTTP_ERROR',
          message: error.message
        }
      };
    }

    // Default error response
    return baseResponse;
  }

  private static buildPrismaErrorResponse(error: Prisma.PrismaClientKnownRequestError, baseResponse: ErrorResponse): ErrorResponse {
    switch (error.code) {
      case 'P2002':
        return {
          ...baseResponse,
          error: {
            ...baseResponse.error,
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: 'A record with this information already exists',
            details: { field: error.meta?.target }
          }
        };
      case 'P2025':
        return {
          ...baseResponse,
          error: {
            ...baseResponse.error,
            code: 'NOT_FOUND',
            message: 'The requested resource was not found'
          }
        };
      case 'P2003':
        return {
          ...baseResponse,
          error: {
            ...baseResponse.error,
            code: 'FOREIGN_KEY_VIOLATION',
            message: 'Invalid reference to related resource'
          }
        };
      default:
        return {
          ...baseResponse,
          error: {
            ...baseResponse.error,
            code: 'DATABASE_ERROR',
            message: 'A database error occurred'
          }
        };
    }
  }

  private static buildTRPCErrorResponse(error: TRPCError, baseResponse: ErrorResponse): ErrorResponse {
    return {
      ...baseResponse,
      error: {
        ...baseResponse.error,
        code: error.code,
        message: error.message,
        details: error.cause
      }
    };
  }
}

/**
 * Main Error Handler
 */
export class ErrorHandler {
  private logger: ErrorLogger;

  constructor() {
    this.logger = ErrorLogger.getInstance();
  }

  /**
   * Handle errors in Fastify routes
   */
  async handleFastifyError(error: FastifyError, request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const context = this.buildErrorContext(request);
    const severity = this.determineSeverity(error);

    // Log the error
    this.logger.log(error, context, severity);

    // Build error response
    const errorResponse = ErrorResponseBuilder.build(error, context);

    // Set appropriate status code
    const statusCode = this.getStatusCode(error);

    // Send response
    reply.code(statusCode).send(errorResponse);
  }

  /**
   * Handle errors in tRPC procedures
   */
  handleTRPCError(error: Error, context: Partial<ErrorContext>): never {
    const fullContext = {
      requestId: context.requestId || this.generateRequestId(),
      method: 'tRPC',
      url: context.url || 'unknown',
      ...context
    } as ErrorContext;

    const severity = this.determineSeverity(error);

    // Log the error
    this.logger.log(error, fullContext, severity);

    // Convert to tRPC error
    if (error instanceof TRPCError) {
      throw error;
    }

    // Map custom errors to tRPC errors
    if (error instanceof ValidationError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error.message,
        cause: { field: error.field, value: error.value }
      });
    }

    if (error instanceof AuthenticationError) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: error.message
      });
    }

    if (error instanceof AuthorizationError) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: error.message
      });
    }

    if (error instanceof BusinessLogicError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error.message
      });
    }

    if (error instanceof RepositoryError) {
      if (error.statusCode === 404) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error.message
        });
      }
      if (error.statusCode === 409) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: error.message
        });
      }
    }

    // Default to internal server error
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    });
  }

  /**
   * Handle uncaught exceptions
   */
  handleUncaughtException(error: Error): void {
    const context: ErrorContext = {
      requestId: this.generateRequestId(),
      method: 'UNCAUGHT',
      url: 'process'
    };

    this.logger.log(error, context, 'critical');

    // In production, we might want to exit gracefully
    if (process.env.NODE_ENV === 'production') {
      console.error('Uncaught exception occurred. Shutting down gracefully...');
      process.exit(1);
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(reason: any): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    const context: ErrorContext = {
      requestId: this.generateRequestId(),
      method: 'UNHANDLED_REJECTION',
      url: 'process'
    };

    this.logger.log(error, context, 'critical');

    // In production, we might want to exit gracefully
    if (process.env.NODE_ENV === 'production') {
      console.error('Unhandled promise rejection. Shutting down gracefully...');
      process.exit(1);
    }
  }

  /**
   * Build error context from request
   */
  private buildErrorContext(request: FastifyRequest): ErrorContext {
    return {
      userId: (request as any).user?.id,
      requestId: (request as any).requestId || this.generateRequestId(),
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      method: request.method,
      url: request.url,
      body: request.body,
      query: request.query
    };
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'critical';
    }

    // High severity errors
    if (error instanceof AuthenticationError || error instanceof ExternalServiceError) {
      return 'high';
    }

    // Medium severity errors
    if (error instanceof BusinessLogicError || error instanceof RepositoryError) {
      return 'medium';
    }

    // Low severity errors
    if (error instanceof ValidationError) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Get HTTP status code for error
   */
  private getStatusCode(error: Error): number {
    if (error instanceof ValidationError) return 400;
    if (error instanceof AuthenticationError) return 401;
    if (error instanceof AuthorizationError) return 403;
    if (error instanceof RateLimitError) return 429;
    if (error instanceof ExternalServiceError) return 502;
    if (error instanceof RepositoryError) return error.statusCode;

    if ('statusCode' in error) {
      return (error as any).statusCode;
    }

    return 500;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

/**
 * Fastify error handler plugin
 */
export const errorHandlerPlugin = async (fastify: any) => {
  fastify.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    await errorHandler.handleFastifyError(error, request, reply);
  });

  // Add request ID to all requests
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any).requestId = errorHandler['generateRequestId']();
  });
};

/**
 * Process error handlers
 */
export const setupProcessErrorHandlers = (): void => {
  process.on('uncaughtException', (error: Error) => {
    errorHandler.handleUncaughtException(error);
  });

  process.on('unhandledRejection', (reason: any) => {
    errorHandler.handleUnhandledRejection(reason);
  });
};

// Export error classes for use throughout the application
export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ExternalServiceError,
  BusinessLogicError
};