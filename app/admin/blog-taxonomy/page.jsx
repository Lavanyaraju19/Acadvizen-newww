export const revalidate = 0
export const dynamic = 'force-dynamic'

import { Surface } from '../../../src/components/ui/Surface'
import EntityCrudManager from '../_components/EntityCrudManager'

export default function Page() {
  return (
    <Surface className="space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">Blog Taxonomy</h2>
        <p className="mt-1 text-sm text-slate-300">Manage blog authors, categories, and tags.</p>
      </div>

      <EntityCrudManager
        entity="authors"
        title="Authors"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug' },
          { key: 'avatar', label: 'Avatar URL', full: true },
          { key: 'bio', label: 'Bio', type: 'textarea', full: true, rows: 4 },
        ]}
      />

      <EntityCrudManager
        entity="blog_categories"
        title="Blog Categories"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug' },
          { key: 'description', label: 'Description', type: 'textarea', full: true },
        ]}
      />

      <EntityCrudManager
        entity="blog_tags"
        title="Blog Tags"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'slug', label: 'Slug' },
        ]}
      />
    </Surface>
  )
}
