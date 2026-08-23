const DEFAULT_PUBLIC_APP_URL = "https://veilpay-spri-t4knu9mv.manus.space";

function normalizeUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isDevelopmentPreviewHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".manus.computer")
  );
}

export function passwordResetBaseUrl(input: {
  requestOrigin?: string;
  isProduction: boolean;
  configuredPublicAppUrl?: string;
}) {
  const configured =
    normalizeUrl(input.configuredPublicAppUrl) ?? DEFAULT_PUBLIC_APP_URL;

  if (input.isProduction) return configured;

  const requestOrigin = normalizeUrl(input.requestOrigin);
  if (!requestOrigin) return configured;

  const hostname = new URL(requestOrigin).hostname;
  return isDevelopmentPreviewHost(hostname) ? requestOrigin : configured;
}
