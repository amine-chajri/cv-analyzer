/**
 * Canonical list of CV template slugs offered by the app.
 *
 * Generated from the FlowCV gallery scrape (scripts/scrapeFlowcvTemplates.mjs
 * writes flowcvTemplateSlugs.json); the client builds its catalogue from the
 * same scrape (client/src/data/flowcvTemplates.json), so both stay in sync.
 * This registry exists so the server can reject unknown values before they
 * reach the database.
 */
const TEMPLATE_SLUGS = require('./flowcvTemplateSlugs.json');

const TEMPLATE_SLUG_SET = new Set(TEMPLATE_SLUGS);

const isValidTemplateSlug = (value) => TEMPLATE_SLUG_SET.has(value);

module.exports = { TEMPLATE_SLUGS, TEMPLATE_SLUG_SET, isValidTemplateSlug };
