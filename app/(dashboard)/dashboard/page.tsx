import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Card, Grid, Heading, Stack, Text } from "@chakra-ui/react";
import { createThinkificClient } from "@/lib/graphql";
import {
  GET_SITE_INFO,
  GET_COURSES,
  type SiteInfo,
  type CoursesResponse,
} from "@/lib/queries/site";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const subdomain = cookieStore.get("subdomain")?.value;

  if (!subdomain) {
    redirect("/login");
  }

  const client = createThinkificClient(subdomain);

  // Fetch site info and courses in parallel
  let siteInfo: SiteInfo | null = null;
  let coursesData: CoursesResponse | null = null;
  let error: string | null = null;

  try {
    const [siteResult, coursesResult] = await Promise.all([
      client.request<SiteInfo>(GET_SITE_INFO),
      client.request<CoursesResponse>(GET_COURSES, { first: 10 }),
    ]);
    siteInfo = siteResult;
    coursesData = coursesResult;
  } catch (e) {
    console.error("[Dashboard] Failed to fetch data:", e);
    error = e instanceof Error ? e.message : "Failed to load data";
  }

  return (
    <Stack gap={8}>
      {/* Welcome Section */}
      <Box>
        <Heading size="xl" mb={2}>
          Welcome to your Dashboard
        </Heading>
        <Text color="gray.600" _dark={{ color: "gray.400" }}>
          Your Thinkific app is successfully connected. Here is your site
          information.
        </Text>
      </Box>

      {error ? (
        <Box
          p={6}
          bg="red.50"
          _dark={{ bg: "red.900/20" }}
          borderRadius="lg"
          borderLeft="4px solid"
          borderColor="red.500"
        >
          <Text color="red.700" _dark={{ color: "red.300" }}>
            {error}
          </Text>
        </Box>
      ) : (
        <>
          {/* Site Info Card */}
          {siteInfo && (
            <Card.Root>
              <Card.Header>
                <Card.Title>Site Information</Card.Title>
                <Card.Description>
                  Details about your connected Thinkific site
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>
                      Site Name
                    </Text>
                    <Text fontWeight="medium">{siteInfo.site.name}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>
                      Subdomain
                    </Text>
                    <Text fontWeight="medium">{siteInfo.site.subdomain}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>
                      URL
                    </Text>
                    <Text fontWeight="medium">{siteInfo.site.url}</Text>
                  </Box>
                </Grid>
              </Card.Body>
            </Card.Root>
          )}

          {/* Courses Card */}
          {coursesData && (
            <Card.Root>
              <Card.Header>
                <Card.Title>Your Courses</Card.Title>
                <Card.Description>
                  Courses available on your Thinkific site
                </Card.Description>
              </Card.Header>
              <Card.Body>
                {coursesData.site.courses.edges.length === 0 ? (
                  <Text color="gray.500">No courses found.</Text>
                ) : (
                  <Stack gap={4}>
                    {coursesData.site.courses.edges.map(({ node: course }) => (
                      <Box
                        key={course.id}
                        p={4}
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor="gray.200"
                        _dark={{ borderColor: "gray.700" }}
                      >
                        <Heading size="sm">{course.name}</Heading>
                        <Text fontSize="xs" color="gray.400" mt={1}>
                          ID: {course.id}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Card.Body>
            </Card.Root>
          )}
        </>
      )}

      {/* API Example Section */}
      <Card.Root>
        <Card.Header>
          <Card.Title>GraphQL API Example</Card.Title>
          <Card.Description>
            Example of a GraphQL query used to fetch this data
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <Box
            as="pre"
            p={4}
            bg="gray.900"
            color="gray.100"
            borderRadius="md"
            overflow="auto"
            fontSize="sm"
          >
            <code>{`query GetSiteInfo {
  site {
    id
    name
    subdomain
    url
  }
}

query GetCourses($first: Int!) {
  site {
    courses(first: $first) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}`}</code>
          </Box>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
