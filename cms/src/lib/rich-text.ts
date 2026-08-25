import sanitizeHtml from 'sanitize-html'

/**
 * Rich text is stored as HTML in the same `content` string the plain textarea
 * used, which is what keeps existing blocks readable: a paragraph of plain text
 * is already valid HTML, so nothing needs migrating.
 *
 * Everything is sanitised on the way in, against an allow-list that mirrors the
 * editor's own extension set. The editor can only produce these tags, but the
 * server must not trust that — the payload arrives over an API, and "the client
 * would never send that" is not a security model (§50).
 */

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'h4',
]

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      // No class, style, id or data-*: the portfolio decides how this looks,
      // and an editor that can set a class is an editor that can restyle the
      // site (§3, §62.14).
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Anything not on the list loses its tag but keeps its words, so
    // sanitising can never silently delete someone's copy.
    disallowedTagsMode: 'discard',
    transformTags: {
      // Links out of a case study should not hand the opener a window
      // reference; noopener also implies no reverse-tabnabbing.
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.href?.startsWith('http')
          ? { ...attribs, target: '_blank', rel: 'noreferrer noopener' }
          : attribs,
      }),
      // The editor offers h2–h4; anything pasted in as h1 is demoted rather
      // than dropped, since a case study page already owns its h1.
      h1: 'h2',
      h5: 'h4',
      h6: 'h4',
      b: 'strong',
      i: 'em',
    },
  }).trim()
}

/** True when the value carries no words — an empty editor still emits "<p></p>". */
export function isRichTextEmpty(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim().length === 0
}
