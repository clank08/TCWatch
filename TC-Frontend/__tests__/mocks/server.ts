import { setupServer } from 'msw/native';
import { backendAPIHandlers } from './handlers';

// Setup MSW server for React Native tests
export const server = setupServer(...backendAPIHandlers);

// Server lifecycle methods for React Native
export const startMockServer = () => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
};

export const stopMockServer = () => {
  server.close();
};

export const resetMockServer = () => {
  server.resetHandlers();
};

// Helper to override handlers for specific tests
export const overrideMockHandlers = (...handlers: any[]) => {
  server.use(...handlers);
};

// Common mock scenarios for mobile testing
export const mockNetworkError = () => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.get('*', () => {
      return HttpResponse.error();
    }),
    http.post('*', () => {
      return HttpResponse.error();
    })
  );
};

export const mockSlowNetwork = (delay: number = 5000) => {
  const { http, HttpResponse, delay: mswDelay } = require('msw');

  server.use(
    http.get('*', async () => {
      await mswDelay(delay);
      return HttpResponse.json({ data: 'delayed response' });
    }),
    http.post('*', async () => {
      await mswDelay(delay);
      return HttpResponse.json({ data: 'delayed response' });
    })
  );
};

export const mockAuthenticationError = () => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.post('/api/trpc/auth.login', () => {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Invalid credentials',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          },
        },
      }, { status: 401 });
    }),

    http.get('/api/trpc/auth.me', () => {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Session expired',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          },
        },
      }, { status: 401 });
    })
  );
};

export const mockValidationError = () => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.post('/api/trpc/*', () => {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Validation error',
            code: -32602,
            data: {
              code: 'BAD_REQUEST',
              httpStatus: 400,
              zodError: {
                fieldErrors: {
                  email: ['Invalid email format'],
                  password: ['Password must be at least 8 characters'],
                },
              },
            },
          },
        },
      }, { status: 400 });
    })
  );
};

export const mockServerError = () => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.get('*', () => {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Internal server error',
            code: -32603,
            data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
          },
        },
      }, { status: 500 });
    }),
    http.post('*', () => {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Internal server error',
            code: -32603,
            data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
          },
        },
      }, { status: 500 });
    })
  );
};

export const mockOfflineMode = () => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.get('*', () => {
      return HttpResponse.error();
    }),
    http.post('*', () => {
      return HttpResponse.error();
    })
  );
};