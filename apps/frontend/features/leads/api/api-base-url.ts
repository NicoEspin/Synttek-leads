function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

export function getApiUrl(pathname: string) {
  if (!pathname.startsWith("/")) {
    throw new Error(`API pathname must start with '/': ${pathname}`);
  }

  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;
  if (configuredBaseUrl) {
    return `${normalizeBaseUrl(configuredBaseUrl)}${pathname}`;
  }

  if (typeof window === "undefined") {
    return `http://localhost:4000${pathname}`;
  }

  return pathname;
}
