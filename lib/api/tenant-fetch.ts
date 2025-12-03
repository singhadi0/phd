import { cookies, headers } from "next/headers";

type RequestInitOptions = {
  method: string;
  body?: unknown;
};

async function tenantApiRequest<T>(
  tenantSlug: string,
  route: string,
  init: RequestInitOptions
): Promise<T> {
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const fallbackBase = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const baseUrl = host ? `${protocol}://${host}` : fallbackBase;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const headersToSend: Record<string, string> = {
    Accept: "application/json",
  };

  if (cookieHeader.length > 0) {
    headersToSend.Cookie = cookieHeader;
  }

  const requestInit: RequestInit = {
    method: init.method,
    headers: headersToSend,
    cache: "no-store",
  };

  if (init.body !== undefined) {
    headersToSend["Content-Type"] = "application/json";
    requestInit.body = JSON.stringify(init.body);
  }

  const response = await fetch(`${baseUrl}/api/tenants/${tenantSlug}${route}`, {
    ...requestInit,
  });

  if (!response.ok) {
    const message = `Failed to load ${route} for tenant ${tenantSlug}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchTenantApi<T>(
  tenantSlug: string,
  route: string
): Promise<T> {
  return tenantApiRequest<T>(tenantSlug, route, { method: "GET" });
}

export async function mutateTenantApi<T>(
  tenantSlug: string,
  route: string,
  init: { method?: "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown }
): Promise<T> {
  const method = init.method ?? "POST";
  return tenantApiRequest<T>(tenantSlug, route, {
    method,
    body: init.body,
  });
}
