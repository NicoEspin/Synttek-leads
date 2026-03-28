type BuildWhatsappChatUrlInput = {
  whatsappUrl: string | null;
  phoneE164: string | null;
};

function sanitizePhoneForWa(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

function normalizeExistingWhatsappUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    if (trimmed.startsWith("wa.me/") || trimmed.startsWith("api.whatsapp.com/")) {
      return `https://${trimmed}`;
    }

    return trimmed;
  } catch {
    return null;
  }
}

export function buildWhatsappChatUrl(input: BuildWhatsappChatUrlInput) {
  const fromUrl = input.whatsappUrl ? normalizeExistingWhatsappUrl(input.whatsappUrl) : null;
  if (fromUrl) {
    return fromUrl;
  }

  if (!input.phoneE164) {
    return null;
  }

  const phone = sanitizePhoneForWa(input.phoneE164);
  if (!phone) {
    return null;
  }

  return `https://wa.me/${phone}`;
}
