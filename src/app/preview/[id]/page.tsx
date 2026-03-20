import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTemplate, TemplateId } from '@/lib/templates'
import type { GeneratedContent } from '@/components/LandingPagePreview'
import PreviewContent from './PreviewContent'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const adminSupabase = createAdminClient()
  const { data: generation } = await adminSupabase
    .from('generations')
    .select('input_data')
    .eq('id', params.id)
    .single()

  if (!generation) return { title: 'Preview not found' }

  const inputData = generation.input_data as { productName: string }
  return { title: `${inputData.productName} — Landing Page Preview` }
}

export default async function PreviewPage({ params }: PageProps) {
  const adminSupabase = createAdminClient()

  const { data: generation, error } = await adminSupabase
    .from('generations')
    .select('id, input_data, output_copy, template_id')
    .eq('id', params.id)
    .single()

  if (error || !generation) {
    notFound()
  }

  const outputCopy = generation.output_copy as GeneratedContent
  const inputData = generation.input_data as { productName: string }
  const template = getTemplate((generation.template_id ?? 'saas') as TemplateId)

  return (
    <PreviewContent
      data={outputCopy}
      productName={inputData.productName}
      template={template}
    />
  )
}
