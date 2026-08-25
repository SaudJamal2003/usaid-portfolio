/**
 * The shape of the CMS public content payload.
 *
 * Hand-written rather than generated: the portfolio must not depend on the CMS
 * package, and this doubles as the contract both sides agree on. Everything is
 * optional at the top level because a CMS outage has to be survivable (§18).
 */

export type CmsMedia = {
  id: string
  url: string
  thumbUrl: string
  mediumUrl: string
  alt: string
  width: number | null
  height: number | null
  mimeType: string
}

export type CmsProject = {
  title: string
  slug: string
  shortDescription: string | null
  aspectRatio: string | null
  thumbnail: CmsMedia | null
  featured: boolean
  caseStudySlug: string | null
}

export type CmsExperience = {
  company: string
  role: string
  description: string | null
  highlights: string[]
  startDate: string
  endDate: string | null
  isCurrent: boolean
  location: string | null
  logo: CmsMedia | null
}

export type CmsMentor = {
  name: string
  role: string
  tribute: string
  photo: CmsMedia | null
}

export type CmsBlock = {
  id: string
  type: string
  data: Record<string, unknown> & { media?: CmsMedia | CmsMedia[] | null }
}

export type CmsCaseStudy = {
  slug: string
  title: string
  shortDescription: string | null
  client: string | null
  role: string | null
  duration: string | null
  projectType: string | null
  heroTitle: string | null
  heroDescription: string | null
  hero: CmsMedia | null
  thumbnail: CmsMedia | null
  status: string
  blocks: CmsBlock[]
}

export type CmsContent = {
  settings: {
    siteName: string
    siteDescription: string
    contactEmail: string
    location: string | null
    availabilityLabel: string | null
    clientsLabel: string | null
  } | null
  hero: {
    eyebrow: string | null
    titlePrefix: string
    typingWords: string[]
    portrait: CmsMedia | null
  } | null
  about: { heading: string; bio: string; portrait: CmsMedia | null } | null
  footer: { email: string; description: string | null; copyright: string | null } | null
  contactCta: { note: string | null; buttonLabel: string; buttonUrl: string } | null
  clientAvatars: CmsMedia[]
  navigation: { label: string; url: string; openInNewTab: boolean }[]
  socials: { platform: string; url: string }[]
  stats: { value: string; caption: string; blurb: string | null }[]
  experience: CmsExperience[]
  mentors: CmsMentor[]
  gallery: { caption: string | null; image: CmsMedia | null }[]
  services: { title: string; description: string; icon: CmsMedia | null }[]
  testimonials: { name: string; role: string | null; company: string | null; quote: string }[]
  projects: CmsProject[]
  caseStudies: { slug: string; title: string; shortDescription: string | null; client: string | null }[]
}

/* Narrow structural check rather than a schema library. The payload comes from
   a service we control, the cost of being wrong is falling back to bundled
   content, and adding a validator to the portfolio bundle for this is not worth
   the kilobytes. */
export function looksLikeContent(value: unknown): value is CmsContent {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.experience) &&
    Array.isArray(candidate.mentors) &&
    Array.isArray(candidate.navigation)
  )
}
