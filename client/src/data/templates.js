/**
 * CV template catalogue.
 *
 * Names, descriptions, download formats and ATS classifications for the 13
 * templates published on resume.io's Professional page were taken from that
 * page. The remaining 16 city templates are listed in that page's markup
 * (`data-templates-order`) but are not rendered with marketing copy, so their
 * layout/style labels here are our own classification, not scraped text.
 *
 * Previews are drawn with CSS from `layout` rather than hotlinking images, so
 * the gallery works offline and never depends on a third-party CDN.
 *
 * Must stay in sync with server/config/templates.js.
 */

/** Visual layout, drives the CSS mini-preview. */
export const LAYOUTS = {
  TWO_COLUMN: 'two-column',
  SIDEBAR: 'sidebar',
  ONE_COLUMN: 'one-column',
  TIMELINE: 'timeline',
  CENTERED: 'centered',
};

/** Filter groupings shown as chips above the grid. */
export const CATEGORIES = [
  'All',
  'Two column',
  'One column',
  'ATS optimised',
  'Classic',
  'Modern',
];

export const TEMPLATES = [
  {
    slug: 'dublin',
    name: 'Professional',
    layout: LAYOUTS.TWO_COLUMN,
    accent: 'indigo',
    categories: ['Two column', 'Modern'],
    formats: ['pdf', 'docx'],
    monochrome: true,
    featured: true,
    description:
      'A touch of personality with a well-organised resume structure. Our most popular pick.',
  },
  {
    slug: 'new_york',
    name: 'Corporate',
    layout: LAYOUTS.TIMELINE,
    accent: 'slate',
    categories: ['One column', 'Classic'],
    formats: ['pdf', 'docx'],
    description:
      'Professional and elegant resume template built around a timeline structure.',
  },
  {
    slug: 'vienna',
    name: 'Clear',
    layout: LAYOUTS.TWO_COLUMN,
    accent: 'sky',
    categories: ['Two column', 'Modern'],
    formats: ['pdf', 'docx'],
    description:
      'Striking modern header paired with a professional two-column body structure.',
  },
  {
    slug: 'brussels',
    name: 'Two Column ATS',
    layout: LAYOUTS.TWO_COLUMN,
    accent: 'emerald',
    categories: ['Two column', 'ATS optimised'],
    formats: ['pdf'],
    description:
      'A simple, two-tone resume template. Easy to read and it highlights your experience.',
  },
  {
    slug: 'milan',
    name: 'Harmonized',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'rose',
    categories: ['One column', 'Modern'],
    formats: ['pdf'],
    description: 'Streamlined professional resume template with a human touch.',
  },
  {
    slug: 'toronto',
    name: 'Defined',
    layout: LAYOUTS.CENTERED,
    accent: 'amber',
    categories: ['One column', 'Modern'],
    formats: ['pdf'],
    description:
      'A web-inspired resume template, perfect for chatting up your achievements on one page.',
  },
  {
    slug: 'chicago',
    name: 'Authority',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'zinc',
    categories: ['One column', 'Classic'],
    formats: ['pdf'],
    description:
      'Bold, forward-leaning structure that is impossible to ignore. For when you really need to impress.',
  },
  {
    slug: 'copenhagen',
    name: 'Half Tone',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'violet',
    categories: ['One column', 'Classic'],
    formats: ['pdf'],
    description:
      'Puts your personal story first, blending a traditional structure with attention-grabbing design.',
  },
  {
    slug: 'geneva',
    name: 'Statement',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'fuchsia',
    categories: ['One column', 'Modern'],
    formats: ['pdf'],
    description: 'Minimalist typography against an electric background. Edgy by design.',
  },
  {
    slug: 'london',
    name: 'Classic',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'stone',
    categories: ['One column', 'Classic'],
    formats: ['pdf', 'docx'],
    monochrome: true,
    description: 'Classically structured resume template, made for a robust career history.',
  },
  {
    slug: 'santiago',
    name: 'Traditional',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'blue',
    categories: ['One column', 'Classic'],
    formats: ['pdf', 'docx'],
    monochrome: true,
    description: 'Classic full-page resume template with generously sized sections.',
  },
  {
    slug: 'berlin',
    name: 'Clean',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'neutral',
    categories: ['One column', 'ATS optimised'],
    formats: ['pdf'],
    monochrome: true,
    description: 'Modern resume template with bold, clean formatting.',
  },
  {
    slug: 'helsinki',
    name: 'Prime ATS',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'blue',
    categories: ['One column', 'ATS optimised'],
    formats: ['pdf', 'docx'],
    description:
      'Streamlined and optimised for maximum applicant-tracking-system compatibility and readability.',
  },

  // --- City series ---------------------------------------------------------
  // Listed on resume.io's Professional page markup but published without
  // marketing copy, so labels below are our own classification.
  {
    slug: 'sydney',
    name: 'Sydney',
    layout: LAYOUTS.TWO_COLUMN,
    accent: 'sky',
    categories: ['Two column', 'Modern'],
    formats: ['pdf'],
    description: 'Clean two-column city layout with a clear contact header.',
  },
  {
    slug: 'stockholm',
    name: 'Stockholm',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'slate',
    categories: ['One column', 'Classic'],
    formats: ['pdf'],
    description: 'Restrained single-column layout with generous whitespace.',
  },
  {
    slug: 'paris',
    name: 'Paris',
    layout: LAYOUTS.CENTERED,
    accent: 'rose',
    categories: ['One column', 'Classic'],
    formats: ['pdf'],
    description: 'Centred header with an elegant, editorial section rhythm.',
  },
  {
    slug: 'amsterdam',
    name: 'Amsterdam',
    layout: LAYOUTS.SIDEBAR,
    accent: 'emerald',
    categories: ['Two column', 'Modern'],
    formats: ['pdf'],
    description: 'Sidebar rail for skills and contact, main column for experience.',
  },
  {
    slug: 'barcelona',
    name: 'Barcelona',
    layout: LAYOUTS.TWO_COLUMN,
    accent: 'amber',
    categories: ['Two column', 'Modern'],
    formats: ['pdf'],
    description: 'Balanced two-column grid with a bold accent rule.',
  },
  {
    slug: 'tokyo',
    name: 'Tokyo',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'zinc',
    categories: ['One column', 'Modern'],
    formats: ['pdf'],
    description: 'Precise single-column layout with tight typographic detail.',
  },
  {
    slug: 'lisbon',
    name: 'Lisbon',
    layout: LAYOUTS.TIMELINE,
    accent: 'violet',
    categories: ['One column', 'Classic'],
    formats: ['pdf'],
    description: 'Timeline-driven single column that foregrounds progression.',
  },
  {
    slug: 'rio',
    name: 'Rio',
    layout: LAYOUTS.TWO_COLUMN,
    accent: 'emerald',
    categories: ['Two column', 'Modern'],
    formats: ['pdf'],
    description: 'Vivid two-column layout suited to client-facing roles.',
  },
  {
    slug: 'cape_town',
    name: 'Cape Town',
    layout: LAYOUTS.SIDEBAR,
    accent: 'sky',
    categories: ['Two column', 'Modern'],
    formats: ['pdf'],
    description: 'Full-height sidebar with a compact single-column body.',
  },
  {
    slug: 'rome',
    name: 'Rome',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'stone',
    categories: ['One column', 'Classic'],
    formats: ['pdf'],
    description: 'Traditional serif-leaning structure for formal sectors.',
  },
  {
    slug: 'singapore',
    name: 'Singapore',
    layout: LAYOUTS.TWO_COLUMN,
    accent: 'blue',
    categories: ['Two column', 'ATS optimised'],
    formats: ['pdf'],
    description: 'Dense but tidy two-column layout built for high-volume screening.',
  },
  {
    slug: 'oslo',
    name: 'Oslo',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'neutral',
    categories: ['One column', 'ATS optimised'],
    formats: ['pdf'],
    description: 'Minimal single column that parses cleanly in any ATS.',
  },
  {
    slug: 'athens',
    name: 'Athens',
    layout: LAYOUTS.CENTERED,
    accent: 'amber',
    categories: ['One column', 'Classic'],
    formats: ['pdf'],
    description: 'Symmetrical centred header with a classical section order.',
  },
  {
    slug: 'prague',
    name: 'Prague',
    layout: LAYOUTS.TIMELINE,
    accent: 'rose',
    categories: ['One column', 'Modern'],
    formats: ['pdf'],
    description: 'Timeline spine with a refined, contemporary feel.',
  },
  {
    slug: 'shanghai',
    name: 'Shanghai',
    layout: LAYOUTS.SIDEBAR,
    accent: 'fuchsia',
    categories: ['Two column', 'Modern'],
    formats: ['pdf'],
    description: 'Dense sidebar layout that fits dense bilingual CVs.',
  },
  {
    slug: 'moscow',
    name: 'Moscow',
    layout: LAYOUTS.ONE_COLUMN,
    accent: 'zinc',
    categories: ['One column', 'Classic'],
    formats: ['pdf'],
    description: 'Understated single column with a formal, conservative layout.',
  },
];

export const TEMPLATE_SLUGS = TEMPLATES.map((t) => t.slug);

/** Tailwind-safe accent token -> raw hex, for the CSS-drawn previews. */
export const ACCENTS = {
  indigo: { base: '#4f46e5', soft: '#e0e7ff' },
  slate: { base: '#475569', soft: '#e2e8f0' },
  sky: { base: '#0284c7', soft: '#e0f2fe' },
  emerald: { base: '#059669', soft: '#d1fae5' },
  rose: { base: '#e11d48', soft: '#ffe4e6' },
  amber: { base: '#d97706', soft: '#fef3c7' },
  zinc: { base: '#3f3f46', soft: '#e4e4e7' },
  violet: { base: '#7c3aed', soft: '#ede9fe' },
  fuchsia: { base: '#c026d3', soft: '#fae8ff' },
  stone: { base: '#78716c', soft: '#e7e5e4' },
  blue: { base: '#2563eb', soft: '#dbeafe' },
  neutral: { base: '#525252', soft: '#e5e5e5' },
};

export const getTemplate = (slug) => TEMPLATES.find((t) => t.slug === slug) || null;

export const isKnownSlug = (slug) => TEMPLATE_SLUGS.includes(slug);