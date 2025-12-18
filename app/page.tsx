import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const cookieStore = await cookies();
  const subdomain = cookieStore.get('subdomain')?.value;

  if (subdomain) {
    // Check if session is still valid
    const session = await prisma.session.findUnique({
      where: { subdomain },
    });

    if (session && session.expiresAt > new Date()) {
      redirect('/dashboard');
    }
  }

  // No valid session, redirect to login
  redirect('/login');
}
