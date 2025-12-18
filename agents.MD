# AI Agent Rules for Learn Alchemy

This document provides AI coding assistants with comprehensive rules and context for building this Thinkific app. Follow these guidelines to ensure consistent, high-quality code generation.

---

## Project Context

**Project Name:** Learn Alchemy  
**Purpose:** Thinkific App Development Starter Repository  
**Target Platform:** Thinkific Marketplace Apps  
**Primary Use Case:** Building embedded apps that integrate with Thinkific's learning platform

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React framework with App Router |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| Chakra UI | v3 | Component library |
| Prisma | Latest | Database ORM |
| SQLite | 3.x | Session storage database |
| graphql-request | Latest | GraphQL client |
| TanStack Query | v5 | Server state management |
| Zod | Latest | Schema validation |

---

## Next.js 16 Rules

### App Router Patterns

1. **Always use the App Router** - All routes go in the `app/` directory
2. **Default to Server Components** - Only add `'use client'` when necessary
3. **Use Server Actions for mutations** - Prefer Server Actions over API routes for form submissions

### File Conventions

```
app/
├── (auth)/                    # Route group for auth pages
│   ├── login/page.tsx
│   └── callback/page.tsx
├── (dashboard)/               # Route group for authenticated pages
│   ├── layout.tsx             # Shared dashboard layout
│   └── page.tsx
├── api/                       # API routes
│   ├── auth/
│   │   ├── callback/route.ts
│   │   └── refresh/route.ts
│   └── graphql/route.ts
├── layout.tsx                 # Root layout
├── page.tsx                   # Home page
└── providers.tsx              # Client-side providers
```

### Server vs Client Components

```typescript
// Server Component (default) - NO directive needed
export default async function ServerComponent() {
  const data = await fetchData(); // Can use async/await directly
  return <div>{data}</div>;
}

// Client Component - REQUIRES directive
'use client';
export default function ClientComponent() {
  const [state, setState] = useState(); // Can use hooks
  return <div>{state}</div>;
}
```

### When to Use Client Components

- Interactive UI (onClick, onChange, onSubmit)
- React hooks (useState, useEffect, useContext)
- Browser APIs (localStorage, window)
- Chakra UI interactive components
- TanStack Query hooks

---

## React 19 Rules

### New Patterns

1. **Use the `use()` hook** for reading promises and context in render:
```typescript
import { use } from 'react';

function Component({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise);
  return <div>{data.name}</div>;
}
```

2. **Server Actions** for form handling:
```typescript
// app/actions.ts
'use server';

export async function submitForm(formData: FormData) {
  const name = formData.get('name');
  // Process data
}
```

3. **useActionState** for form state:
```typescript
'use client';
import { useActionState } from 'react';
import { submitForm } from './actions';

function Form() {
  const [state, formAction, isPending] = useActionState(submitForm, null);
  return (
    <form action={formAction}>
      <button type="submit" disabled={isPending}>Submit</button>
    </form>
  );
}
```

4. **useOptimistic** for optimistic updates:
```typescript
const [optimisticItems, addOptimisticItem] = useOptimistic(
  items,
  (state, newItem) => [...state, newItem]
);
```

---

## Chakra UI v3 Rules

### Setup Requirements

1. **Provider Setup** in `app/providers.tsx`:
```typescript
'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ColorModeProvider } from '@chakra-ui/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider>{children}</ColorModeProvider>
    </ChakraProvider>
  );
}
```

2. **Import in root layout**:
```typescript
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Component Usage Rules

1. **Use Chakra components for ALL UI elements** - Do not mix with raw HTML or other UI libraries
2. **Use semantic color tokens** - `colorPalette` prop for theming
3. **Use the `asChild` pattern** for composition:
```typescript
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

4. **Use Chakra's built-in components**:
```typescript
// Good - Use Chakra components
import { Box, Flex, Text, Button, Input, Stack } from '@chakra-ui/react';

// Avoid - Raw HTML
<div>, <span>, <button>, <input>
```

### Layout Components

```typescript
// Use Stack for vertical layouts
<Stack gap={4}>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
</Stack>

// Use Flex for horizontal layouts
<Flex gap={4} align="center">
  <Box>Left</Box>
  <Box>Right</Box>
</Flex>

// Use Grid for complex layouts
<Grid templateColumns="repeat(3, 1fr)" gap={4}>
  <GridItem>1</GridItem>
  <GridItem>2</GridItem>
  <GridItem>3</GridItem>
</Grid>
```

### Form Components

```typescript
import { Field, Input, Button } from '@chakra-ui/react';

<Field.Root>
  <Field.Label>Email</Field.Label>
  <Input type="email" />
  <Field.ErrorText>Invalid email</Field.ErrorText>
</Field.Root>
```

### Color Mode

```typescript
'use client';
import { useColorMode, IconButton } from '@chakra-ui/react';
import { LuMoon, LuSun } from 'react-icons/lu';

function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton onClick={toggleColorMode} aria-label="Toggle color mode">
      {colorMode === 'light' ? <LuMoon /> : <LuSun />}
    </IconButton>
  );
}
```

---

## Prisma + SQLite Rules

### Schema Location

Place schema at `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Session {
  id           String   @id @default(cuid())
  subdomain    String   @unique
  accessToken  String
  refreshToken String
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  thinkificId String @unique
  email     String
  firstName String?
  lastName  String?
  subdomain String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Database URL

In `.env`:
```
DATABASE_URL="file:./dev.db"
```

### Prisma Client Setup

Create `lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Query Patterns

```typescript
// Always use try-catch for database operations
try {
  const session = await prisma.session.findUnique({
    where: { subdomain },
  });
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch session');
}

// Use transactions for multiple operations
await prisma.$transaction([
  prisma.session.update({ where: { id }, data: { accessToken } }),
  prisma.user.update({ where: { id: userId }, data: { updatedAt: new Date() } }),
]);
```

---

## Thinkific OAuth Rules

### Environment Variables

Required in `.env.local`:
```
THINKIFIC_CLIENT_ID=your_client_id
THINKIFIC_CLIENT_SECRET=your_client_secret
THINKIFIC_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXTAUTH_SECRET=your_random_secret
```

### OAuth Flow Implementation

1. **Authorization URL** - `app/api/auth/authorize/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain');
  
  const authUrl = new URL('https://app.thinkific.com/oauth2/authorize');
  authUrl.searchParams.set('client_id', process.env.THINKIFIC_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', process.env.THINKIFIC_REDIRECT_URI!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('subdomain', subdomain!);
  
  return NextResponse.redirect(authUrl.toString());
}
```

2. **Callback Handler** - `app/api/auth/callback/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const subdomain = searchParams.get('subdomain');
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://app.thinkific.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.THINKIFIC_CLIENT_ID,
      client_secret: process.env.THINKIFIC_CLIENT_SECRET,
      redirect_uri: process.env.THINKIFIC_REDIRECT_URI,
    }),
  });
  
  const tokens = await tokenResponse.json();
  
  // Store session in database
  await prisma.session.upsert({
    where: { subdomain: subdomain! },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
    create: {
      subdomain: subdomain!,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  
  return NextResponse.redirect('/dashboard');
}
```

3. **Token Refresh** - Create utility in `lib/auth.ts`:
```typescript
import { prisma } from './prisma';

export async function getValidToken(subdomain: string): Promise<string> {
  const session = await prisma.session.findUnique({
    where: { subdomain },
  });
  
  if (!session) {
    throw new Error('No session found');
  }
  
  // Check if token is expired (with 5 minute buffer)
  if (session.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    const refreshedTokens = await refreshAccessToken(session.refreshToken);
    
    await prisma.session.update({
      where: { subdomain },
      data: {
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token,
        expiresAt: new Date(Date.now() + refreshedTokens.expires_in * 1000),
      },
    });
    
    return refreshedTokens.access_token;
  }
  
  return session.accessToken;
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://app.thinkific.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.THINKIFIC_CLIENT_ID,
      client_secret: process.env.THINKIFIC_CLIENT_SECRET,
    }),
  });
  
  return response.json();
}
```

---

## GraphQL Integration Rules

### Setup with graphql-request + TanStack Query

1. **Install dependencies**:
```bash
npm install graphql graphql-request @tanstack/react-query
```

2. **Create GraphQL client** - `lib/graphql.ts`:
```typescript
import { GraphQLClient } from 'graphql-request';
import { getValidToken } from './auth';

export function createThinkificClient(subdomain: string) {
  return {
    async request<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
      const token = await getValidToken(subdomain);
      
      const client = new GraphQLClient(
        `https://api.thinkific.com/graphql`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Thinkific-Subdomain': subdomain,
          },
        }
      );
      
      return client.request<T>(query, variables);
    },
  };
}
```

3. **TanStack Query Provider** - Update `app/providers.tsx`:
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={defaultSystem}>
        {children}
      </ChakraProvider>
    </QueryClientProvider>
  );
}
```

### Query Patterns

1. **Define queries in separate files** - `lib/queries/courses.ts`:
```typescript
import { gql } from 'graphql-request';

export const GET_COURSES = gql`
  query GetCourses($first: Int!, $after: String) {
    courses(first: $first, after: $after) {
      edges {
        node {
          id
          name
          description
          slug
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_COURSE_BY_ID = gql`
  query GetCourseById($id: ID!) {
    course(id: $id) {
      id
      name
      description
      chapters {
        id
        name
        lessons {
          id
          name
        }
      }
    }
  }
`;
```

2. **Create custom hooks** - `hooks/useCourses.ts`:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { GET_COURSES } from '@/lib/queries/courses';

interface Course {
  id: string;
  name: string;
  description: string;
  slug: string;
}

interface CoursesResponse {
  courses: {
    edges: Array<{ node: Course; cursor: string }>;
    pageInfo: { hasNextPage: boolean; endCursor: string };
  };
}

export function useCourses(subdomain: string) {
  return useQuery({
    queryKey: ['courses', subdomain],
    queryFn: async (): Promise<CoursesResponse> => {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GET_COURSES,
          variables: { first: 10 },
          subdomain,
        }),
      });
      
      const { data } = await response.json();
      return data;
    },
  });
}
```

3. **Server-side GraphQL** for Server Components:
```typescript
// app/dashboard/page.tsx
import { createThinkificClient } from '@/lib/graphql';
import { GET_COURSES } from '@/lib/queries/courses';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const subdomain = cookieStore.get('subdomain')?.value;
  
  if (!subdomain) {
    redirect('/login');
  }
  
  const client = createThinkificClient(subdomain);
  const data = await client.request(GET_COURSES, { first: 10 });
  
  return <CourseList courses={data.courses.edges} />;
}
```

### Error Handling

```typescript
import { useQuery } from '@tanstack/react-query';

export function useCourses(subdomain: string) {
  return useQuery({
    queryKey: ['courses', subdomain],
    queryFn: fetchCourses,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('401')) return false;
      return failureCount < 3;
    },
  });
}

// In component
function CourseList() {
  const { data, error, isLoading } = useCourses(subdomain);
  
  if (isLoading) return <Spinner />;
  if (error) return <Alert status="error">{error.message}</Alert>;
  
  return <div>{/* render courses */}</div>;
}
```

---

## GraphQL Schema Reference

**IMPORTANT:** When creating or modifying GraphQL queries for Thinkific, always reference the schema file first.

### Schema Location

The Thinkific GraphQL API schema is stored at:
- `lib/queries/schema.graphql`

### Rules for AI Assistants

1. **Always read the schema first** - Before writing any GraphQL query or mutation, read `lib/queries/schema.graphql` to understand available types, fields, and arguments
2. **Validate against schema** - Ensure all queries use only fields and types defined in the schema
3. **Check field availability** - Verify that requested fields exist on the types before including them in queries
4. **Use correct argument types** - Reference the schema for required vs optional arguments and their types

### Workflow for Creating GraphQL Queries

1. Read `lib/queries/schema.graphql` to understand the API structure
2. Identify the relevant types and fields for the use case
3. Create the query in the appropriate file under `lib/queries/`
4. Include TypeScript type definitions that match the query response

---

## Directory Structure

```
learn-alchemy/
├── app/
│   ├── (auth)/                 # Auth-related pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── page.tsx
│   ├── (dashboard)/            # Protected pages
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx            # Dashboard home
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── authorize/route.ts
│   │   │   ├── callback/route.ts
│   │   │   └── refresh/route.ts
│   │   └── graphql/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── LoadingSpinner.tsx
│   ├── courses/                # Feature-specific components
│   │   ├── CourseCard.tsx
│   │   └── CourseList.tsx
│   └── auth/
│       └── LoginForm.tsx
├── hooks/                      # Custom React hooks
│   ├── useCourses.ts
│   ├── useSession.ts
│   └── useThinkificClient.ts
├── lib/                        # Utilities and configurations
│   ├── auth.ts
│   ├── graphql.ts
│   ├── prisma.ts
│   └── queries/
│       ├── courses.ts
│       └── users.ts
├── prisma/
│   └── schema.prisma
├── types/                      # TypeScript type definitions
│   ├── thinkific.ts
│   └── api.ts
├── .env.local                  # Local environment variables
├── .env.example                # Example env file for reference
└── package.json
```

---

## TypeScript Rules

### Strict Mode

The project uses strict TypeScript. Never use `any` type.

```typescript
// Bad
const data: any = await fetchData();

// Good
interface CourseData {
  id: string;
  name: string;
}
const data: CourseData = await fetchData();
```

### Zod Validation

Use Zod for runtime validation, especially for API responses and form data:

```typescript
import { z } from 'zod';

// Define schema
const CourseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string(),
});

type Course = z.infer<typeof CourseSchema>;

// Validate API response
const courses = CourseSchema.array().parse(apiResponse.data);

// Form validation
const FormSchema = z.object({
  email: z.string().email('Invalid email address'),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters'),
});
```

### Type Definitions

Place shared types in `types/` directory:

```typescript
// types/thinkific.ts
export interface ThinkificUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface ThinkificCourse {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  instructorId: string;
}

export interface PaginatedResponse<T> {
  edges: Array<{ node: T; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}
```

---

## Code Style Guidelines

### Import Order

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { Box, Button } from '@chakra-ui/react';

// 3. Internal absolute imports
import { prisma } from '@/lib/prisma';
import { useCourses } from '@/hooks/useCourses';

// 4. Relative imports
import { CourseCard } from './CourseCard';

// 5. Types (if separate)
import type { Course } from '@/types/thinkific';
```

### Component Patterns

```typescript
// Prefer named exports for components
export function CourseCard({ course }: CourseCardProps) {
  return (/* ... */);
}

// Use interface for props
interface CourseCardProps {
  course: Course;
  onSelect?: (id: string) => void;
}

// Destructure props
function CourseCard({ course, onSelect }: CourseCardProps) {
  // ...
}
```

### Error Handling

```typescript
// Use try-catch with specific error types
try {
  const data = await fetchData();
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth error
    redirect('/login');
  }
  
  console.error('Unexpected error:', error);
  throw error;
}

// Create custom error classes
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
```

### Logging

```typescript
// Use structured logging
console.log('[Auth] User logged in:', { userId, subdomain });
console.error('[GraphQL] Query failed:', { query: queryName, error });

// In production, integrate with a logging service
import { logger } from '@/lib/logger';

logger.info('User action', { action: 'course_view', courseId });
logger.error('API error', { endpoint, statusCode, message });
```

---

## Common Patterns

### Protected Routes

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const subdomain = cookieStore.get('subdomain')?.value;
  
  if (!subdomain) {
    redirect('/login');
  }
  
  const session = await prisma.session.findUnique({
    where: { subdomain },
  });
  
  if (!session || session.expiresAt < new Date()) {
    redirect('/login');
  }
  
  return (
    <Flex>
      <Sidebar />
      <Box flex="1" p={6}>
        {children}
      </Box>
    </Flex>
  );
}
```

### Loading States

```typescript
// app/(dashboard)/courses/loading.tsx
import { Skeleton, Stack } from '@chakra-ui/react';

export default function Loading() {
  return (
    <Stack gap={4}>
      <Skeleton height="40px" />
      <Skeleton height="200px" />
      <Skeleton height="200px" />
    </Stack>
  );
}
```

### Error Boundaries

```typescript
// app/(dashboard)/courses/error.tsx
'use client';

import { Alert, Button, Stack } from '@chakra-ui/react';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Stack gap={4}>
      <Alert status="error">
        Something went wrong: {error.message}
      </Alert>
      <Button onClick={reset}>Try again</Button>
    </Stack>
  );
}
```

---

## Do's and Don'ts

### Do

- Use Server Components by default
- Use Chakra UI components for all UI elements
- Validate all external data with Zod
- Store OAuth tokens securely in the database
- Use TanStack Query for client-side data fetching
- Create reusable hooks for GraphQL queries
- Follow the established directory structure
- Use TypeScript strict mode

### Don't

- Don't use `any` type
- Don't store tokens in localStorage
- Don't mix Chakra UI with other UI libraries
- Don't make GraphQL calls directly in components
- Don't skip error handling
- Don't use default exports for components
- Don't put business logic in components
- Don't use inline styles when Chakra props exist

---

## Quick Reference

### Thinkific API Base URLs

- **OAuth Authorization:** `https://app.thinkific.com/oauth2/authorize`
- **Token Exchange:** `https://app.thinkific.com/oauth2/token`
- **GraphQL API:** `https://api.thinkific.com/graphql`

### Required Headers for Thinkific API

```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'X-Thinkific-Subdomain': subdomain,
  'Content-Type': 'application/json',
}
```

### Common GraphQL Queries

```graphql
# Get current user
query Me {
  me {
    id
    email
    firstName
    lastName
  }
}

# Get courses with pagination
query GetCourses($first: Int!, $after: String) {
  courses(first: $first, after: $after) {
    edges {
      node {
        id
        name
        slug
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

