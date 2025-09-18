// Enhanced Security Middleware for Authentication
import { FastifyRequest, FastifyReply } from 'fastify';
import { TRPCError } from '@trpc/server';
import * as crypto from 'crypto';

export interface SecurityConfig {
  enableCSRFProtection: boolean;
  enableContentSecurityPolicy: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableNoSniff: boolean;
  enableFrameGuard: boolean;
  enableReferrerPolicy: boolean;
  allowedOrigins: string[];
  csrfTokenExpiry: number; // in minutes
  sessionCookieConfig: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number; // in seconds
  };
}

export class SecurityMiddleware {
  private config: SecurityConfig;
  private csrfTokens: Map<string, { token: string; expires: Date }> = new Map();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableCSRFProtection: true,
      enableContentSecurityPolicy: true,
      enableHSTS: process.env.NODE_ENV === 'production',
      enableXSSProtection: true,
      enableNoSniff: true,
      enableFrameGuard: true,
      enableReferrerPolicy: true,
      allowedOrigins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
      csrfTokenExpiry: 60, // 1 hour
      sessionCookieConfig: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
      ...config,
    };
  }

  /**
   * Apply comprehensive security headers
   */
  applySecurityHeaders() {
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        // Content Security Policy
        if (this.config.enableContentSecurityPolicy) {
          reply.header('Content-Security-Policy', this.getCSPHeader());
        }

        // HTTP Strict Transport Security
        if (this.config.enableHSTS && process.env.NODE_ENV === 'production') {
          reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // XSS Protection
        if (this.config.enableXSSProtection) {
          reply.header('X-XSS-Protection', '1; mode=block');
        }

        // Content Type No Sniff
        if (this.config.enableNoSniff) {
          reply.header('X-Content-Type-Options', 'nosniff');
        }

        // Frame Guard
        if (this.config.enableFrameGuard) {
          reply.header('X-Frame-Options', 'DENY');
        }

        // Referrer Policy
        if (this.config.enableReferrerPolicy) {
          reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        }

        // Additional security headers
        reply.header('X-Permitted-Cross-Domain-Policies', 'none');
        reply.header('Cross-Origin-Embedder-Policy', 'require-corp');
        reply.header('Cross-Origin-Opener-Policy', 'same-origin');
        reply.header('Cross-Origin-Resource-Policy', 'same-origin');

        // Remove server information
        reply.removeHeader('X-Powered-By');
        reply.removeHeader('Server');

      } catch (error) {
        console.error('Error applying security headers:', error);
        // Don't block the request if security headers fail
      }
    };
  }

  /**
   * CORS middleware with enhanced security
   */
  setupCORS() {
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const origin = req.headers.origin;
        const allowedOrigins = this.config.allowedOrigins;

        // Check if origin is allowed
        if (origin && allowedOrigins.includes(origin)) {
          reply.header('Access-Control-Allow-Origin', origin);
        } else if (allowedOrigins.includes('*')) {
          reply.header('Access-Control-Allow-Origin', '*');
        }

        // Credentials support
        reply.header('Access-Control-Allow-Credentials', 'true');

        // Allowed methods
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');

        // Allowed headers
        reply.header(
          'Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, X-Session-ID'
        );

        // Exposed headers
        reply.header(
          'Access-Control-Expose-Headers',
          'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-CSRF-Token'
        );

        // Preflight cache
        reply.header('Access-Control-Max-Age', '86400'); // 24 hours

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          reply.status(200);
          reply.send();
          return;
        }

      } catch (error) {
        console.error('Error setting up CORS:', error);
      }
    };
  }

  /**
   * CSRF Token Protection
   */
  createCSRFProtection() {
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      if (!this.config.enableCSRFProtection) {
        return;
      }

      try {
        // Skip CSRF for safe methods
        const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
        if (safeMethods.includes(req.method)) {
          return;
        }

        const sessionId = req.cookies?.session || req.headers['x-session-id'];
        const csrfToken = req.headers['x-csrf-token'] as string;

        if (!sessionId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Session required for CSRF protection',
          });
        }

        if (!csrfToken) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'CSRF token required',
          });
        }

        // Validate CSRF token
        if (!this.validateCSRFToken(sessionId, csrfToken)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Invalid CSRF token',
          });
        }

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('CSRF protection error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'CSRF validation failed',
        });
      }
    };
  }

  /**
   * Generate CSRF token for session
   */
  generateCSRFToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + this.config.csrfTokenExpiry * 60 * 1000);

    this.csrfTokens.set(sessionId, { token, expires });

    // Clean up expired tokens
    this.cleanupExpiredCSRFTokens();

    return token;
  }

  /**
   * Validate CSRF token
   */
  private validateCSRFToken(sessionId: string, token: string): boolean {
    const storedToken = this.csrfTokens.get(sessionId);

    if (!storedToken) {
      return false;
    }

    if (new Date() > storedToken.expires) {
      this.csrfTokens.delete(sessionId);
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(storedToken.token, 'hex'),
      Buffer.from(token, 'hex')
    );
  }

  /**
   * Clean up expired CSRF tokens
   */
  private cleanupExpiredCSRFTokens(): void {
    const now = new Date();
    for (const [sessionId, tokenData] of this.csrfTokens.entries()) {
      if (now > tokenData.expires) {
        this.csrfTokens.delete(sessionId);
      }
    }
  }

  /**
   * Request validation middleware
   */
  createRequestValidator() {
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        // Validate Content-Length for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const contentLength = parseInt(req.headers['content-length'] || '0');
          const maxBodySize = 50 * 1024 * 1024; // 50MB

          if (contentLength > maxBodySize) {
            throw new TRPCError({
              code: 'PAYLOAD_TOO_LARGE',
              message: 'Request body too large',
            });
          }
        }

        // Validate Content-Type for JSON endpoints
        if (req.headers['content-type']?.includes('application/json')) {
          if (!req.body || typeof req.body !== 'object') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid JSON payload',
            });
          }
        }

        // Validate User-Agent (basic check)
        const userAgent = req.headers['user-agent'];
        if (!userAgent || userAgent.length < 3) {
          console.warn('Suspicious request without proper User-Agent:', {
            ip: req.ip,
            path: req.url,
            userAgent,
          });
        }

        // Check for common attack patterns in URL
        this.validateURL(req.url);

        // Check for common attack patterns in headers
        this.validateHeaders(req.headers);

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Request validation error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid request',
        });
      }
    };
  }

  /**
   * Session cookie configuration
   */
  configureSessionCookie(reply: FastifyReply, sessionId: string): void {
    const cookieOptions = {
      httpOnly: this.config.sessionCookieConfig.httpOnly,
      secure: this.config.sessionCookieConfig.secure,
      sameSite: this.config.sessionCookieConfig.sameSite,
      maxAge: this.config.sessionCookieConfig.maxAge * 1000, // Convert to milliseconds
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
    };

    reply.setCookie('session', sessionId, cookieOptions);
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(reply: FastifyReply): void {
    reply.clearCookie('session', {
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
    });
  }

  /**
   * Validate URL for common attack patterns
   */
  private validateURL(url: string): void {
    const suspiciousPatterns = [
      /\.\./,               // Directory traversal
      /\/etc\/passwd/i,     // Unix system files
      /\/proc\//i,          // Unix proc filesystem
      /<script/i,           // XSS attempts
      /javascript:/i,       // JavaScript protocol
      /data:/i,             // Data protocol
      /vbscript:/i,         // VBScript protocol
      /\%3C/i,              // URL encoded < character
      /\%3E/i,              // URL encoded > character
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Suspicious request pattern detected',
        });
      }
    }
  }

  /**
   * Validate headers for suspicious content
   */
  private validateHeaders(headers: Record<string, string | string[] | undefined>): void {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onclick=/i,
    ];

    for (const [headerName, headerValue] of Object.entries(headers)) {
      if (typeof headerValue === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(headerValue)) {
            console.warn(`Suspicious header detected: ${headerName}`, headerValue);
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Suspicious header content detected',
            });
          }
        }
      }
    }
  }

  /**
   * Generate Content Security Policy header
   */
  private getCSPHeader(): string {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Adjust based on your needs
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self' https:",
      "media-src 'self'",
      "object-src 'none'",
      "child-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ];

    return cspDirectives.join('; ');
  }

  /**
   * Get security middleware statistics for monitoring
   */
  getSecurityStats(): {
    csrfTokensActive: number;
    configuredOrigins: string[];
    securityHeadersEnabled: string[];
  } {
    const enabledHeaders: string[] = [];

    if (this.config.enableCSRFProtection) enabledHeaders.push('CSRF Protection');
    if (this.config.enableContentSecurityPolicy) enabledHeaders.push('CSP');
    if (this.config.enableHSTS) enabledHeaders.push('HSTS');
    if (this.config.enableXSSProtection) enabledHeaders.push('XSS Protection');
    if (this.config.enableNoSniff) enabledHeaders.push('No Sniff');
    if (this.config.enableFrameGuard) enabledHeaders.push('Frame Guard');
    if (this.config.enableReferrerPolicy) enabledHeaders.push('Referrer Policy');

    return {
      csrfTokensActive: this.csrfTokens.size,
      configuredOrigins: this.config.allowedOrigins,
      securityHeadersEnabled: enabledHeaders,
    };
  }
}