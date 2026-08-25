import { describe, expect, it } from 'vitest'
import { sanitizeRichText, isRichTextEmpty } from '@/lib/rich-text'
import { parseBlock, mediaIdsInBlock, BLOCK_TYPES } from '@/lib/blocks'
import { slugify } from '@/lib/slug'
import { checkUpload, SIZE_LIMITS, formatBytes } from '@/lib/upload-policy'

/* No database. These are the rules that decide what is allowed to exist. */

describe('rich text sanitising', () => {
  it('strips scripts but keeps the words around them', () => {
    const out = sanitizeRichText('<p>before</p><script>alert(1)</script><p>after</p>')
    expect(out).not.toMatch(/script/i)
    expect(out).toContain('before')
    expect(out).toContain('after')
  })

  it.each([
    ['event handler', '<p onclick="alert(1)">x</p>', /onclick/i],
    ['javascript href', '<a href="javascript:alert(1)">x</a>', /javascript:/i],
    ['inline style', '<p style="color:red">x</p>', /style=/i],
    ['class attribute', '<p class="bg-red-500">x</p>', /class=/i],
    ['iframe', '<iframe src="https://evil.test"></iframe>', /iframe/i],
    ['img onerror', '<img src=x onerror=alert(1)>', /onerror/i],
  ])('removes %s', (_label, input, forbidden) => {
    expect(sanitizeRichText(input)).not.toMatch(forbidden)
  })

  it('keeps the formatting the editor is allowed to produce', () => {
    const out = sanitizeRichText(
      '<h2>Head</h2><p><strong>b</strong> <em>i</em></p><ul><li>one</li></ul><blockquote>q</blockquote>',
    )
    for (const tag of ['<h2>', '<strong>', '<em>', '<ul>', '<li>', '<blockquote>']) {
      expect(out).toContain(tag)
    }
  })

  it('demotes h1, because the page owns its own', () => {
    expect(sanitizeRichText('<h1>Title</h1>')).toBe('<h2>Title</h2>')
  })

  it('hardens external links', () => {
    const out = sanitizeRichText('<a href="https://example.com">x</a>')
    expect(out).toContain('rel="noreferrer noopener"')
    expect(out).toContain('target="_blank"')
  })

  it('leaves in-page links alone', () => {
    expect(sanitizeRichText('<a href="#work">x</a>')).not.toContain('target=')
  })

  it('recognises an empty document', () => {
    expect(isRichTextEmpty('<p></p>')).toBe(true)
    expect(isRichTextEmpty('<p>  </p>')).toBe(true)
    expect(isRichTextEmpty('<p>a</p>')).toBe(false)
  })

  it('treats plain text as valid content, which is what keeps old blocks working', () => {
    expect(sanitizeRichText('just words')).toBe('just words')
  })
})

describe('block validation', () => {
  it('rejects an unknown block type', () => {
    const result = parseBlock('NOT_A_BLOCK', {})
    expect(result.ok).toBe(false)
  })

  it('every declared type has a schema', () => {
    for (const type of BLOCK_TYPES) {
      // An empty payload may be invalid, but the type must be recognised.
      const result = parseBlock(type, {})
      if (!result.ok) expect(result.error).not.toMatch(/Unknown block type/)
    }
  })

  it('sanitises rich text on the way through', () => {
    const result = parseBlock('TEXT', { content: '<p>ok</p><script>alert(1)</script>' })
    expect(result.ok).toBe(true)
    if (result.ok) expect((result.data as { content: string }).content).not.toMatch(/script/i)
  })

  it('rejects a gallery with no images', () => {
    expect(parseBlock('GALLERY', { mediaIds: [], columns: 3 }).ok).toBe(false)
  })

  it('rejects a video with neither a file nor a URL', () => {
    expect(parseBlock('VIDEO', {}).ok).toBe(false)
    expect(parseBlock('VIDEO', { externalUrl: 'https://example.com/v.mp4' }).ok).toBe(true)
  })

  it('finds media ids for the delete guard', () => {
    expect(mediaIdsInBlock('IMAGE', { mediaId: 'abc' })).toEqual(['abc'])
    expect(mediaIdsInBlock('GALLERY', { mediaIds: ['a', 'b'] })).toEqual(['a', 'b'])
    expect(mediaIdsInBlock('TEXT', { content: 'x' })).toEqual([])
  })
})

describe('slugs', () => {
  it.each([
    ['KaroKar — B2B2C Mobility', 'karokar-b2b2c-mobility'],
    ['  Spaces   Everywhere  ', 'spaces-everywhere'],
    ['Already-Slugged', 'already-slugged'],
    ['!!!', ''],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('caps length so a slug cannot become a URL problem', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(80)
  })
})

describe('upload policy', () => {
  it('rejects a type that is not on the allow-list', () => {
    const result = checkUpload('application/x-msdownload', 1000)
    expect(result.ok).toBe(false)
  })

  it('rejects an empty file', () => {
    expect(checkUpload('image/png', 0).ok).toBe(false)
  })

  it('allows a large video, which is the whole point of the presigned path', () => {
    expect(checkUpload('video/mp4', 95 * 1024 * 1024).ok).toBe(true)
  })

  it('still refuses a video past the ceiling', () => {
    const result = checkUpload('video/mp4', SIZE_LIMITS.video + 1)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/500 MB/)
  })

  it('holds images to a much lower ceiling than video', () => {
    expect(checkUpload('image/png', 30 * 1024 * 1024).ok).toBe(false)
    expect(SIZE_LIMITS.image).toBeLessThan(SIZE_LIMITS.video)
  })

  it('formats sizes readably', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(95 * 1024 * 1024)).toBe('95 MB')
  })
})
