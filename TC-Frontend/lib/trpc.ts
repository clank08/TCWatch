import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { supabase } from './supabase';
import { globalRequestIdManager } from '@/hooks/use-request-id';

// Define the router type based on what we know exists
// This would normally be imported from the backend, but for now we'll define it locally
export type AppRouter = {
  search: {
    content: any;
    suggestions: any;
    universal: any;
    faceted: any;
    related: any;
    byCase: any;
    byPerson: any;
    trending: any;
    multi: any;
    trackAnalytics: any;
    stats: any;
    startIndexing: any;
    indexingStatus: any;
    activeJobs: any;
    cancelIndexing: any;
    health: any;
    clearCache: any;
  };
  auth: {
    me: any;
    updateProfile: any;
    signIn: any;
    signUp: any;
    signOut: any;
    refreshToken: any;
    updatePrivacySettings: any;
    updateNotificationSettings: any;
  };
  content: {
    trending: any;
    cases: any;
    browse: any;
    search: any;
    getById: any;
    getByIds: any;
    getTrending: any;
    getRecommendations: any;
    track: any;
    untrack: any;
    getTracked: any;
    trackEpisodeProgress: any;
    getEpisodeProgress: any;
    getSearchSuggestions: any;
    getDiscoveryFacets: any;
    getDetailedContent: any;
    getCastAndCrew: any;
    getEpisodes: any;
    getRelatedContent: any;
    getAvailability: any;
    userAction: any;
    bulkImport: any;
    // Time-to-complete endpoints
    getTimeEstimate: any;
    getWatchlistTimeEstimate: any;
    updateTimeEstimateOnProgress: any;
    getBatchTimeEstimates: any;
    clearTimeEstimateCache: any;
  };
  social: any;
  notification: any;
};

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Get the API URL from environment or default to local development
const getBaseUrl = () => {
  // In development, use backend on port 3001
  if (__DEV__ || process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }

  // In production, you would set this via environment variables
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
};

// Create the tRPC client
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      // Add auth and request ID headers
      headers: async () => {
        try {
          // Generate a unique request ID for this request
          const requestId = globalRequestIdManager.generateRequestId('trpc');

          // Get the current session from Supabase
          const { data: { session } } = await supabase.auth.getSession();

          const headers: Record<string, string> = {
            'x-request-id': requestId,
          };

          if (session?.access_token) {
            console.log('[tRPC] Adding auth header to request');
            headers.authorization = `Bearer ${session.access_token}`;
          } else {
            console.log('[tRPC] No session token available');
          }

          return headers;
        } catch (error) {
          console.error('[tRPC] Error getting headers:', error);
          // Even if we fail to get auth token, still send request ID
          return {
            'x-request-id': globalRequestIdManager.generateRequestId('trpc-error'),
          };
        }
      },
      fetch: (url, options) => {
        // Extract request ID from headers for logging
        const headers = options?.headers as Record<string, string> | undefined;
        const requestId = headers?.['x-request-id'] || 'unknown';

        console.log('====================================');
        console.log('=== [tRPC] NEW REQUEST ===');
        console.log('====================================');
        console.log('[tRPC] URL:', url);
        console.log('[tRPC] Request ID:', requestId);
        console.log('[tRPC] Method:', options?.method);
        console.log('[tRPC] Headers:', JSON.stringify(options?.headers, null, 2));

        let parsedBody;
        try {
          parsedBody = options?.body ? JSON.parse(options.body as string) : undefined;
          console.log('[tRPC] Request Body:', JSON.stringify(parsedBody, null, 2));
        } catch (e) {
          console.log('[tRPC] Request Body (raw):', options?.body);
        }

        // Use the global fetch
        return fetch(url, options)
          .then(async (response) => {
            console.log('====================================');
            console.log('=== [tRPC] RESPONSE RECEIVED ===');
            console.log('====================================');
            console.log('[tRPC] Status:', response.status, response.statusText);
            console.log('[tRPC] Response Headers:', {
              contentType: response.headers.get('content-type'),
              requestId: response.headers.get('X-Request-ID'),
            });

            // Extract response request ID
            const responseRequestId = response.headers.get('X-Request-ID');
            const responseText = await response.clone().text();

            console.log('[tRPC] Response text length:', responseText.length);

            let parsedResponse;
            try {
              parsedResponse = responseText ? JSON.parse(responseText) : 'empty';
              console.log('[tRPC] Parsed Response:', JSON.stringify(parsedResponse, null, 2));

              // Check if this is a batch response
              if (Array.isArray(parsedResponse)) {
                console.log('[tRPC] Batch response with', parsedResponse.length, 'items');
                parsedResponse.forEach((item, idx) => {
                  console.log(`[tRPC] Batch item ${idx}:`, JSON.stringify(item, null, 2));
                  if (item.result?.data?.results) {
                    console.log(`[tRPC] Batch item ${idx} has ${item.result.data.results.length} results`);
                  }
                });
              } else if (parsedResponse?.result?.data) {
                console.log('[tRPC] Single response data:', JSON.stringify(parsedResponse.result.data, null, 2));
                if (parsedResponse.result.data.results) {
                  console.log('[tRPC] Results count:', parsedResponse.result.data.results.length);
                }
              }
            } catch (e) {
              console.log('[tRPC] Could not parse response:', responseText.substring(0, 500));
            }

            // Store the response request ID if present
            if (responseRequestId && responseRequestId !== requestId) {
              console.log('[tRPC] Server generated different request ID:', responseRequestId);
            }

            console.log('====================================');
            console.log('=== [tRPC] RESPONSE COMPLETE ===');
            console.log('====================================');

            return response;
          })
          .catch((error) => {
            console.log('====================================');
            console.log('=== [tRPC] FETCH ERROR ===');
            console.log('====================================');
            console.error('[tRPC] Request ID:', requestId);
            console.error('[tRPC] Error:', error);
            console.error('[tRPC] Error message:', error?.message);
            console.error('[tRPC] Error stack:', error?.stack);
            console.log('====================================');

            // Attach request ID to error for better debugging
            if (error instanceof Error) {
              (error as any).requestId = requestId;
            }
            throw error;
          });
      },
    }),
  ],
});