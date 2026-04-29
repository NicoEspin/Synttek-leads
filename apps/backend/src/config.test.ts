import assert from "node:assert/strict";
import test from "node:test";

import { parseOrigins, toOriginMatcher } from "./config";

test("parseOrigins normalizes scheme-relative entries to https", () => {
  assert.deepEqual(parseOrigins(" //synttek-leads-frontend.vercel.app , http://localhost:3000 "), [
    "https://synttek-leads-frontend.vercel.app",
    "http://localhost:3000",
  ]);
});

test("toOriginMatcher keeps exact origin matching strict", () => {
  const matches = toOriginMatcher("https://synttek-leads-frontend.vercel.app");

  assert.equal(matches("https://synttek-leads-frontend.vercel.app"), true);
  assert.equal(matches("https://synttek-leads-frontend-git-main.vercel.app"), false);
  assert.equal(matches("http://synttek-leads-frontend.vercel.app"), false);
});

test("toOriginMatcher supports constrained vercel preview patterns", () => {
  const matches = toOriginMatcher("https://synttek-leads-frontend-*.vercel.app");

  assert.equal(matches("https://synttek-leads-frontend-git-main-j4nd9.vercel.app"), true);
  assert.equal(matches("https://synttek-leads-frontend-preview.vercel.app"), true);
  assert.equal(matches("https://synttek-leads-frontend-preview.other.vercel.app"), false);
  assert.equal(matches("https://another-app.vercel.app"), false);
});

test("toOriginMatcher rejects invalid wildcard catch-all patterns", () => {
  assert.throws(() => toOriginMatcher("https://*"), /cannot match every host/i);
});
