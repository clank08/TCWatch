// Error handling middleware for Fastify
import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';

/**
 * Global error handler for Fastify
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log the error
  request.log.error({
    error: error.message,
    stack: isDevelopment ? error.stack : undefined,
    url: request.url,
    method: request.method,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  });

  // Handle different types of errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: isDevelopment ? error.validation : undefined,
      },
    });
  }

  if (error.statusCode === 401) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  if (error.statusCode === 403) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      },
    });
  }

  if (error.statusCode === 404) {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    });
  }

  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    });
  }

  // Handle known application errors
  if (error.message === 'UNAUTHORIZED') {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  if (error.message === 'FORBIDDEN') {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      },
    });
  }

  // Default server error
  const statusCode = error.statusCode || 500;

  reply.status(statusCode).send({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      details: isDevelopment ? {
        stack: error.stack,
        statusCode: error.statusCode,
        name: error.name,
      } : undefined,
    },
  });
}

/**
 * Handle 404 errors for routes that don't exist
 */
export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
  });
}