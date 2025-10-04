import { cookies } from 'next/headers';
import type { AdminSession } from './index';

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const shop = jar.get('shp_shop')?.value;
  const accessToken = jar.get('shp_token')?.value;
  if (!shop || !accessToken) return null;
  return { shop, accessToken };
}
