'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Spinner,
} from '@chakra-ui/react';

function LoginForm() {
  const [subdomain, setSubdomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subdomain.trim()) {
      return;
    }

    setIsLoading(true);

    // Redirect to the authorization endpoint
    router.push(`/api/auth/authorize?subdomain=${encodeURIComponent(subdomain.trim())}`);
  };

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'missing_code':
        return 'Authorization failed. Please try again.';
      case 'missing_subdomain':
        return 'Missing subdomain information. Please try again.';
      case 'auth_failed':
        return 'Authentication failed. Please check your credentials and try again.';
      default:
        return errorCode ? `Error: ${errorCode}` : null;
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <Box
      w="full"
      bg="white"
      _dark={{ bg: 'gray.800' }}
      p={8}
      borderRadius="xl"
      shadow="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap={6}>
          {errorMessage && (
            <Box
              p={4}
              bg="red.50"
              _dark={{ bg: 'red.900/20' }}
              borderRadius="md"
              borderLeft="4px solid"
              borderColor="red.500"
            >
              <Text color="red.700" _dark={{ color: 'red.300' }}>
                {errorMessage}
              </Text>
            </Box>
          )}

          <Stack gap={2}>
            <Text fontWeight="medium" fontSize="sm">
              Thinkific Subdomain
            </Text>
            <Flex align="center" gap={0}>
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="your-school"
                size="lg"
                borderRightRadius={0}
                autoFocus
              />
              <Box
                px={4}
                py={3}
                bg="gray.100"
                borderRightRadius="md"
                borderWidth="1px"
                borderLeft="0"
                borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                _dark={{ bg: 'gray.700' }}
              >
                <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
                  .thinkific.com
                </Text>
              </Box>
            </Flex>
            <Text color="gray.500" fontSize="xs">
              Enter the subdomain of your Thinkific site
            </Text>
          </Stack>

          <Button
            type="submit"
            colorPalette="blue"
            size="lg"
            w="full"
            loading={isLoading}
            disabled={!subdomain.trim()}
          >
            Connect to Thinkific
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

function LoginFormSkeleton() {
  return (
    <Box
      w="full"
      bg="white"
      _dark={{ bg: 'gray.800' }}
      p={8}
      borderRadius="xl"
      shadow="lg"
    >
      <Flex justify="center" align="center" h="200px">
        <Spinner size="lg" />
      </Flex>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="md" py={20}>
        <Flex direction="column" align="center" gap={8}>
          <Stack gap={2} textAlign="center">
            <Heading size="2xl" fontWeight="bold">
              Learn Alchemy
            </Heading>
            <Text color="gray.600" _dark={{ color: 'gray.400' }} fontSize="lg">
              Connect your Thinkific site to get started
            </Text>
          </Stack>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>

          <Text color="gray.500" fontSize="sm" textAlign="center">
            You will be redirected to Thinkific to authorize this app
          </Text>
        </Flex>
      </Container>
    </Box>
  );
}
