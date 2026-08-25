import { PageHeader } from '@/components/ui'
import { MediaLibrary } from '@/components/MediaLibrary'

export const dynamic = 'force-dynamic'

export default function MediaPage() {
  return (
    <>
      <PageHeader
        title="Media Library"
        description="Every image, video and document used across the portfolio. Anything here can be selected from any content type."
      />
      <MediaLibrary />
    </>
  )
}
