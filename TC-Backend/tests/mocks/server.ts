import { setupServer } from 'msw/node';
import { externalAPIHandlers, internalAPIHandlers } from './handlers';

// Setup MSW server for Node.js tests
export const server = setupServer(...externalAPIHandlers, ...internalAPIHandlers);

// Server lifecycle methods
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

// Common mock scenarios
export const mockNetworkError = () => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.get('*', () => {
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
    })
  );
};

export const mockUnauthorized = () => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.post('/api/trpc/*', () => {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Unauthorized',
            code: -32001,
            data: {
              code: 'UNAUTHORIZED',
              httpStatus: 401,
            },
          },
        },
      }, { status: 401 });
    })
  );
};

export const mockRateLimited = () => {
  const { http, HttpResponse } = require('msw');

  server.use(
    http.get('*', () => {
      return HttpResponse.json({
        error: 'Rate limit exceeded',
      }, {
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      });
    })
  );
};