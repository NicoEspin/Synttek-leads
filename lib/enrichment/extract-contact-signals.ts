import * as cheerio from "cheerio";

type Verification = "confirmed" | "candidate";
type Confidence = "high" | "medium" | "low";

type ContactSignal = {
  channel: "whatsapp" | "instagram";
  value: string;
  verification: Verification;
  confidence: Confidence;
};

type ExtractionResult = {
  whatsappUrl: string | null;
  whatsappSource: Verification | null;
  instagramUrl: string | null;
  instagramHandle: string | null;
  instagramSource: Verification | null;
  contacts: ContactSignal[];
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeUrl(raw: string) {
  const normalized = normalizeWhitespace(raw);
  if (!normalized) {
    return null;
  }

  try {
    const candidate = normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `https://${normalized}`;

    const parsed = new URL(candidate);
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeInstagramHandle(raw: string) {
  const cleaned = raw.trim().replace(/^@+/, "").toLowerCase();
  if (!cleaned) {
    return null;
  }

  if (!/^[a-z0-9._]{1,30}$/.test(cleaned)) {
    return null;
  }

  return `@${cleaned}`;
}

function extractInstagramHandleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("instagram.com")) {
      return null;
    }

    const firstPath = parsed.pathname.split("/").filter(Boolean)[0];
    if (!firstPath) {
      return null;
    }

    return sanitizeInstagramHandle(firstPath);
  } catch {
    return null;
  }
}

function pushUnique(signals: ContactSignal[], next: ContactSignal) {
  const exists = signals.some((signal) => signal.channel === next.channel && signal.value === next.value);
  if (!exists) {
    signals.push(next);
  }
}

function parseSameAsInstagram(rawJson: string): string[] {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    const values: string[] = [];

    const walk = (value: unknown) => {
      if (!value) {
        return;
      }

      if (typeof value === "string") {
        if (value.includes("instagram.com")) {
          values.push(value);
        }
        return;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          walk(item);
        }
        return;
      }

      if (typeof value === "object") {
        const objectValue = value as Record<string, unknown>;
        if (objectValue.sameAs) {
          walk(objectValue.sameAs);
        }
      }
    };

    walk(parsed);
    return values;
  } catch {
    return [];
  }
}

export function extractContactSignalsFromHtml(html: string): ExtractionResult {
  const $ = cheerio.load(html);
  const contacts: ContactSignal[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) {
      return;
    }

    const normalizedHref = sanitizeUrl(href);
    if (!normalizedHref) {
      return;
    }

    if (normalizedHref.includes("wa.me/") || normalizedHref.includes("api.whatsapp.com/send")) {
      pushUnique(contacts, {
        channel: "whatsapp",
        value: normalizedHref,
        verification: "confirmed",
        confidence: "high",
      });
    }

    if (normalizedHref.includes("instagram.com/")) {
      pushUnique(contacts, {
        channel: "instagram",
        value: normalizedHref,
        verification: "confirmed",
        confidence: "high",
      });
    }
  });

  $("script[type='application/ld+json']").each((_, element) => {
    const rawJson = $(element).contents().text();
    for (const instagramUrl of parseSameAsInstagram(rawJson)) {
      const normalized = sanitizeUrl(instagramUrl);
      if (!normalized) {
        continue;
      }

      pushUnique(contacts, {
        channel: "instagram",
        value: normalized,
        verification: "confirmed",
        confidence: "high",
      });
    }
  });

  if (!contacts.some((signal) => signal.channel === "instagram")) {
    const visibleText = $("body").text();
    const handleMatch = visibleText.match(/(^|\s)@([a-zA-Z0-9._]{1,30})\b/);
    const handle = handleMatch ? sanitizeInstagramHandle(handleMatch[2]) : null;

    if (handle) {
      pushUnique(contacts, {
        channel: "instagram",
        value: `https://instagram.com/${handle.slice(1)}`,
        verification: "candidate",
        confidence: "low",
      });
    }
  }

  const primaryWhatsapp = contacts.find((signal) => signal.channel === "whatsapp") ?? null;
  const primaryInstagram = contacts.find((signal) => signal.channel === "instagram") ?? null;

  return {
    whatsappUrl: primaryWhatsapp?.value ?? null,
    whatsappSource: primaryWhatsapp?.verification ?? null,
    instagramUrl: primaryInstagram?.value ?? null,
    instagramHandle: primaryInstagram ? extractInstagramHandleFromUrl(primaryInstagram.value) : null,
    instagramSource: primaryInstagram?.verification ?? null,
    contacts,
  };
}

export type EnrichmentContactSignal = ContactSignal;
export type EnrichmentExtractionResult = ExtractionResult;
