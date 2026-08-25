import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ProjectForm, type ProjectValues } from '@/components/ProjectForm'

export const dynamic = 'force-dynamic'

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [project, caseStudies, seo] = await Promise.all([
    db.project.findUnique({ where: { id } }),
    db.caseStudy.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    }),
    db.seoMetadata.findUnique({
      where: { entityType_entityId: { entityType: 'project', entityId: id } },
    }),
  ])
  if (!project) notFound()

  const text = (value: string | null) => value ?? ''

  const initial: ProjectValues = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    shortDescription: text(project.shortDescription),
    category: text(project.category),
    industry: text(project.industry),
    year: text(project.year),
    role: text(project.role),
    externalUrl: text(project.externalUrl),
    aspectRatio: text(project.aspectRatio),
    technologies: project.technologies,
    thumbnailId: text(project.thumbnailId),
    heroId: text(project.heroId),
    caseStudyId: text(project.caseStudyId),
    featured: project.featured,
    status: project.status,
    seoTitle: text(seo?.title ?? null),
    seoDescription: text(seo?.description ?? null),
    seoNoIndex: seo?.noIndex ?? false,
  }

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/projects" className="text-sm text-muted hover:text-ink">
          ← Projects
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{project.title}</h1>
      </div>

      <ProjectForm initial={initial} caseStudies={caseStudies} />
    </>
  )
}
