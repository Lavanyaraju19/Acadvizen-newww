'use client'

import EntityCrudManager from '../_components/EntityCrudManager'

export default function ToolsAdminClient() {
  return (
    <EntityCrudManager
      entity="tools_extended"
      title="Digital Marketing Tools"
      subtitle="Manage the live tools catalog used by the public tools pages and internal linkers."
      fields={[
        { key: 'name', label: 'Tool Name', default: 'Canva' },
        { key: 'slug', label: 'Website URL (auto-generated)', default: 'canva' },
        { key: 'category', label: 'Tool Category', default: 'Design' },
        { key: 'description', label: 'Tool Description', type: 'textarea', rows: 4, full: true, default: 'Free online design tool for creating social media graphics, presentations, and more.' },
        { key: 'logo_url', label: 'Tool Logo/Icon', type: 'file', bucket: 'tools-assets', accept: 'image/*' },
        { key: 'brand_color', label: 'Brand Color (hex code)', default: '#00C4CC' },
        { key: 'website_url', label: 'Tool Website URL', default: 'https://www.canva.com' },
        { key: 'is_active', label: 'Active (Visible on website)', type: 'checkbox', default: true },
      ]}
    />
  )
}
