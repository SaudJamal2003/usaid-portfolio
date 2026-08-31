// This module holds SESSION_SECRET and the MinIO credentials. The import
// makes bundling it into a client component a build error rather than a silent
// secret leak.
import 'server-only'

import { parseEnv } from './env-schema'

export type { Env } from './env-schema'

export const env = parseEnv(process.env)
