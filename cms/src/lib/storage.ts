// Holds the MinIO credentials. Importing this from a client component must
// fail the build, not ship the keys.
import 'server-only'

import { env } from './env'
import { createStorage } from './storage-core'

export { storageKey } from './storage-core'
export type { StorageConfig } from './storage-core'

const storage = createStorage(env)

export const s3 = storage.s3
export const putObject = storage.putObject
export const deleteObject = storage.deleteObject
export const publicUrl = storage.publicUrl
