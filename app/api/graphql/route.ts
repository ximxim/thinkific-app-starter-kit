import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { executeGraphQL } from '@/lib/graphql';
import { AuthError } from '@/lib/auth';

// Schema for validating GraphQL request body
const GraphQLRequestSchema = z.object({
  query: z.string().min(1),
  variables: z.record(z.string(), z.unknown()).optional(),
  subdomain: z.string().optional(), // Optional override, defaults to cookie
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body
    const result = GraphQLRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.format() },
        { status: 400 }
      );
    }

    const { query, variables } = result.data;

    // Get subdomain from request body or cookie
    let subdomain = result.data.subdomain;
    
    if (!subdomain) {
      const cookieStore = await cookies();
      subdomain = cookieStore.get('subdomain')?.value;
    }

    if (!subdomain) {
      return NextResponse.json(
        { error: 'No subdomain found. Please log in.' },
        { status: 401 }
      );
    }

    // Execute the GraphQL query
    console.log('[GraphQL] Executing query for subdomain:', subdomain);
    const data = await executeGraphQL(subdomain, query, variables);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[GraphQL] Error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Handle GraphQL errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

