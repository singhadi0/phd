import type { RoleKey } from "@prisma/client";

import type { NavigationItem } from "@/lib/navigation/types";
import { fetchTenantApi } from "@/lib/api/tenant-fetch";

export async function fetchTenantNavigation(
  tenantSlug: string,
  roleKey: RoleKey
): Promise<NavigationItem[]> {
  const route = `/navigation?role=${encodeURIComponent(roleKey)}`;
  return fetchTenantApi<NavigationItem[]>(tenantSlug, route);
}
