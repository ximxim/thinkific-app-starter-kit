import { GraphQLClient } from 'graphql-request';
import { getValidToken } from './auth';

// Thinkific GraphQL API - use /stable/graphql for production
const THINKIFIC_GRAPHQL_ENDPOINT = 'https://api.thinkific.com/stable/graphql';

/**
 * Create a Thinkific GraphQL client for the given subdomain.
 * Automatically handles token refresh when needed.
 */
export function createThinkificClient(subdomain: string) {
  return {
    async request<T>(
      query: string,
      variables?: Record<string, unknown>
    ): Promise<T> {
      const token = await getValidToken(subdomain);

      const client = new GraphQLClient(THINKIFIC_GRAPHQL_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Thinkific-Subdomain': subdomain,
          'Content-Type': 'application/json',
        },
      });

      return client.request<T>(query, variables);
    },
  };
}

/**
 * Execute a GraphQL query with the given subdomain's credentials.
 * This is a convenience function for one-off queries.
 */
export async function executeGraphQL<T>(
  subdomain: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const client = createThinkificClient(subdomain);
  return client.request<T>(query, variables);
}

