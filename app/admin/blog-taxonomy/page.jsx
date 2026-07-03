export const revalidate = 0
export const dynamic = 'force-dynamic'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Blog Authors & Categories</h2>
        <p className="mt-1 text-sm text-slate-300">Manage blog authors, categories, and tags to organize your content.</p>
      </div>

      <EntityCrudManager
        entity="authors"
        title="Blog Authors"
        subtitle="Create and manage author profiles for blog posts."
        fields={[
          { key: 'name', label: 'Author Name', default: 'John Doe' },
          { key: 'slug', label: 'Website URL (auto-generated)', default: 'john-doe' },
          { key: 'avatar', label: 'Author Photo', type: 'file', bucket: 'site-assets', accept: 'image/*', full: true },
          { key: 'bio', label: 'Author Biography', type: 'textarea', full: true, rows: 4, default: 'Digital marketing expert with 10+ years of experience.' },
        ]}
      />

      <EntityCrudManager
        entity="blog_categories"
        title="Blog Categories"
        subtitle="Organize blog posts into categories for better navigation."
        fields={[
          { key: 'name', label: 'Category Name', default: 'Digital Marketing' },
          { key: 'slug', label: 'Website URL (auto-generated)', default: 'digital-marketing' },
          { key: 'description', label: 'Category Description', type: 'textarea', full: true, default: 'Articles about digital marketing strategies and tips.' },
        ]}
      />

      <EntityCrudManager
        entity="blog_tags"
        title="Blog Tags"
        subtitle="Add tags to blog posts for improved searchability."
        fields={[
          { key: 'name', label: 'Tag Name', default: 'SEO' },
          { key: 'slug', label: 'Website URL (auto-generated)', default: 'seo' },
        ]}
      />
    </Surface>
  )
}
