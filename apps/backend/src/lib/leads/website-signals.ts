type SocialSignalType = "instagram" | "whatsapp" | "facebook" | "tiktok" | "youtube" | "x";

type WebsiteSignals = {
  normalizedUrl: string | null;
  hasWebsite: boolean;
  socialSignalType: SocialSignalType | null;
};

const socialHosts: Array<{ matcher: RegExp; type: SocialSignalType }> = [
  { matcher: /(^|\.)instagram\.com$/i, type: "instagram" },
  { matcher: /(^|\.)facebook\.com$/i, type: "facebook" },
  { matcher: /(^|\.)m\.facebook\.com$/i, type: "facebook" },
  { matcher: /(^|\.)wa\.me$/i, type: "whatsapp" },
  { matcher: /(^|\.)api\.whatsapp\.com$/i, type: "whatsapp" },
  { matcher: /(^|\.)tiktok\.com$/i, type: "tiktok" },
  { matcher: /(^|\.)youtube\.com$/i, type: "youtube" },
  { matcher: /(^|\.)youtu\.be$/i, type: "youtube" },
  { matcher: /(^|\.)x\.com$/i, type: "x" },
  { matcher: /(^|\.)twitter\.com$/i, type: "x" },
];

function normalizeUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(withProtocol);
    return parsed.toString();
  } catch {
    return null;
  }
}

function detectSocialSignalType(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const match = socialHosts.find((item) => item.matcher.test(host));
    return match?.type ?? null;
  } catch {
    return null;
  }
}

export function classifyWebsitePresence(rawUrl: string | null | undefined): WebsiteSignals {
  if (!rawUrl) {
    return {
      normalizedUrl: null,
      hasWebsite: false,
      socialSignalType: null,
    };
  }

  const normalizedUrl = normalizeUrl(rawUrl);
  if (!normalizedUrl) {
    return {
      normalizedUrl: null,
      hasWebsite: false,
      socialSignalType: null,
    };
  }

  const socialSignalType = detectSocialSignalType(normalizedUrl);
  if (socialSignalType) {
    return {
      normalizedUrl,
      hasWebsite: false,
      socialSignalType,
    };
  }

  return {
    normalizedUrl,
    hasWebsite: true,
    socialSignalType: null,
  };
}

export type { SocialSignalType, WebsiteSignals };
