/**
 * Canonical list of CV template slugs offered by the app.
 *
 * The client renders its own catalogue from these slugs; this registry exists
 * so the server can reject unknown values before they reach the database.
 * Keep in sync with client/src/data/templates.js.
 */
const TEMPLATE_SLUGS = [
  'dublin',
  'new_york',
  'vienna',
  'brussels',
  'milan',
  'toronto',
  'chicago',
  'copenhagen',
  'geneva',
  'london',
  'santiago',
  'berlin',
  'helsinki',
  'sydney',
  'stockholm',
  'paris',
  'amsterdam',
  'barcelona',
  'tokyo',
  'lisbon',
  'rio',
  'cape_town',
  'rome',
  'singapore',
  'oslo',
  'athens',
  'prague',
  'shanghai',
  'moscow',
];

const TEMPLATE_SLUG_SET = new Set(TEMPLATE_SLUGS);

const isValidTemplateSlug = (value) => TEMPLATE_SLUG_SET.has(value);

module.exports = { TEMPLATE_SLUGS, TEMPLATE_SLUG_SET, isValidTemplateSlug };