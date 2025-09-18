// Main tRPC Router - Combines all routers
import { router } from '../trpc';
import { authRouter } from './auth.router';
import { contentRouter } from './content-simple';
import { socialRouter } from './social-simple';
import { notificationRouter } from './notification-simple';

/**
 * Main application router
 *
 * This combines all the individual routers into a single root router
 * that will be mounted on the Fastify server.
 */
export const appRouter = router({
  auth: authRouter,
  content: contentRouter,
  social: socialRouter,
  notification: notificationRouter,
});

// Export the router type for use in the frontend
export type AppRouter = typeof appRouter;

// Re-export the combined router as the default export
export { appRouter as router };