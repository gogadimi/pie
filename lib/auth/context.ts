import { auth, currentUser } from '@clerk/nextjs/server';

export async function getCurrentOrgId(): Promise<string | null> {
  const { userId, orgId } = await auth();
  if (!userId) return null;
  return orgId || 'demo-org';
}

export async function getCurrentUser() {
  return await currentUser();
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return { userId, orgId: (await getCurrentOrgId()) || 'demo-org' };
}

/**
 * Extract org context from request (for API routes)
 */
export function getOrgContext(request: Request): string {
  const url = new URL(request.url);
  return url.searchParams.get('orgId') || 'demo-org';
}
