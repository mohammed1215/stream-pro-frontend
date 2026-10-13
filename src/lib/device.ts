const FALLBACK_APP_VERSION = "1.0.0";

/** App version, overridable via the `VITE_APP_VERSION` env var. */
export function getAppVersion(): string {
  return import.meta.env?.VITE_APP_VERSION ?? FALLBACK_APP_VERSION;
}

interface UABrand {
  brand: string;
  version: string;
}

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    brands?: UABrand[];
    platform?: string;
  };
};

function parseBrowser(nav: NavigatorWithUAData, ua: string): string | null {
  const brands = nav.userAgentData?.brands?.filter(
    (b) => b.brand !== "Chromium" && !b.brand.startsWith("Not")
  );
  if (brands && brands.length > 0) {
    return brands[brands.length - 1].brand.replace(" Mobile", "");
  }
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Chrome\//.test(ua)) return "Chrome";
  return null;
}

function parsePlatform(
  nav: NavigatorWithUAData,
  ua: string
): string | null {
  if (nav.userAgentData?.platform) return nav.userAgentData.platform;
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Mac OS/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return null;
}

/** Human-readable device label, e.g. "Chrome on Windows". Never throws. */
export function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  try {
    const nav = navigator as NavigatorWithUAData;
    const browser = parseBrowser(nav, navigator.userAgent);
    const platform = parsePlatform(nav, navigator.userAgent);
    if (browser && platform) return `${browser} on ${platform}`;
    return browser ?? platform ?? "Web Browser";
  } catch {
    return "Web Browser";
  }
}
