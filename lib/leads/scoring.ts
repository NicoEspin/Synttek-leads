type LeadScoreInput = {
  businessName: string;
  rubroComercial: string;
  hasWebsite: boolean;
  phoneE164: string | null;
  instagramUrl: string | null;
  rating: number | null;
  reviewsCount: number;
};

const highConversionRubros = new Set([
  "turismo y hoteleria",
  "gastronomia",
  "estetica y belleza",
  "fitness",
  "inmobiliario",
  "retail",
]);

const chainHints = [
  "mcdonald",
  "burger king",
  "starbucks",
  "mostaza",
  "havanna",
  "franquicia",
  " sa ",
  " s.a ",
  " srl ",
  " corp ",
  " inc ",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function seemsLargeChain(businessName: string) {
  const name = ` ${normalizeText(businessName)} `;
  return chainHints.some((hint) => name.includes(hint));
}

function shouldApplyWeakWebsitePenalty(input: LeadScoreInput) {
  if (!input.hasWebsite) {
    return false;
  }

  const lowRating = input.rating !== null && input.rating <= 3.8;
  const lowReviews = input.reviewsCount <= 20;
  return lowRating || lowReviews;
}

function shouldApplySolidWebsitePenalty(input: LeadScoreInput) {
  if (!input.hasWebsite) {
    return false;
  }

  const strongRating = input.rating !== null && input.rating >= 4.5;
  const strongReviews = input.reviewsCount >= 120;
  return strongRating && strongReviews;
}

function clampScore(value: number) {
  if (value > 100) {
    return 100;
  }

  if (value < -100) {
    return -100;
  }

  return value;
}

export function calculateLeadScore(input: LeadScoreInput) {
  let score = 0;
  const rubro = normalizeText(input.rubroComercial);

  if (!input.hasWebsite) {
    score += 40;
  }

  if (!input.hasWebsite && input.phoneE164) {
    score += 20;
  }

  if (input.reviewsCount >= 80) {
    score += 15;
  }

  if (highConversionRubros.has(rubro)) {
    score += 10;
  }

  if (!input.hasWebsite && input.instagramUrl) {
    score += 10;
  }

  if (shouldApplyWeakWebsitePenalty(input)) {
    score += 5;
  }

  if (shouldApplySolidWebsitePenalty(input)) {
    score -= 15;
  }

  if (seemsLargeChain(input.businessName)) {
    score -= 20;
  }

  return clampScore(score);
}

export type { LeadScoreInput };
