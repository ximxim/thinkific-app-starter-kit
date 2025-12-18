import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Box, Container, Flex, Heading, Text } from '@chakra-ui/react';
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

  // Verify session exists and is valid
  const session = await prisma.session.findUnique({
    where: { subdomain },
  });

  if (!session || session.expiresAt < new Date()) {
    redirect('/login');
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      {/* Header */}
      <Box
        as="header"
        bg="white"
        borderBottomWidth="1px"
        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
        _dark={{ bg: 'gray.800' }}
      >
        <Container maxW="6xl">
          <Flex h="16" align="center" justify="space-between">
            <Heading size="md" fontWeight="semibold">
              Learn Alchemy
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }} fontSize="sm">
              Connected to: {subdomain}.thinkific.com
            </Text>
          </Flex>
        </Container>
      </Box>

      {/* Main content */}
      <Container maxW="6xl" py={8}>
        {children}
      </Container>
    </Box>
  );
}

