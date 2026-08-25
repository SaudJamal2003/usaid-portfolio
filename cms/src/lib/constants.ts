/** Title a freshly created case study carries until it is renamed. Lives here
 *  rather than in the actions file because a 'use server' module may only
 *  export async functions. */
export const NEW_DRAFT_TITLE = 'Untitled case study'

/** Same idea for projects. */
export const NEW_PROJECT_TITLE = 'Untitled project'

/**
 * Ids as they appear in our own URLs and DB rows.
 *
 * Not `.cuid()`: the seed gives some rows readable ids ("exp-0") so it can
 * upsert idempotently, and a cuid assertion rejects those outright -- which
 * made every seeded experience row unsaveable. The id is looked up in the
 * database anyway, so a bad one fails there.
 */
export const ENTITY_ID_MAX = 200

/** Name a freshly created mentor carries until it is filled in. */
export const NEW_MENTOR_NAME = 'New mentor'
