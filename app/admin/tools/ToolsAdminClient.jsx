'use client'

import EntityCrudManager from '../_components/EntityCrudManager'

export default function ToolsAdminClient() {
  return (
    <EntityCrudManager
      entity="tools_extended"
      title="Tools"
      subtitle="Manage the live tools catalog used by the public tools pages and internal linkers."
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 4, full: true },
        { key: 'logo_url', label: 'Logo URL', type: 'file', bucket: 'tools-assets', accept: 'image/*' },
        { key: 'brand_color', label: 'Brand Color' },
        { key: 'website_url', label: 'Website URL' },
        { key: 'is_active', label: 'Active', type: 'checkbox' },
      ]}
    />
  )
}
