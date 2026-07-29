const FULL_ADMIN_ROLE_SLUGS = ['super_admin', 'admin']
const CMS_ACCESS_ROLE_SLUGS = [
  ...FULL_ADMIN_ROLE_SLUGS,
  'editor',
  'author',
  'reviewer',
  'viewer',
  'seo_manager',
  'content_writer',
]

const CONTENT_MANAGEMENT_ACTIONS = ['create', 'read', 'update', 'delete', 'publish']
const CONTENT_EDITOR_ACTIONS = ['create', 'read', 'update', 'publish']
const CONTENT_AUTHOR_ACTIONS = ['create', 'read', 'update', 'submit_review']
const CONTENT_REVIEWER_ACTIONS = ['read', 'approve', 'reject']
const READ_ONLY_ACTIONS = ['read']
const NAVIGATION_RESOURCE_ACTIONS = ['read', 'update']
const RESOURCE_ALIASES = {
  homepage: ['pages'],
  sections: ['pages'],
  cities: ['pages'],
  areas: ['pages'],
  locations: ['pages'],
  templates: ['pages'],
  redirects: ['settings'],
  robots: ['settings'],
  sitemap: ['settings'],
  maintenance: ['settings'],
  header: ['settings', 'menus'],
  footer: ['settings', 'menus'],
  menus: ['settings'],
  leads: ['forms'],
  reusable_sections: ['pages'],
  projects: ['pages'],
  tools: ['pages'],
  faqs: ['pages'],
  testimonials: ['pages'],
}

const FALLBACK_ROLE_PERMISSIONS = {
  super_admin: { '*': ['*'] },
  admin: {
    pages: CONTENT_MANAGEMENT_ACTIONS,
    blogs: CONTENT_MANAGEMENT_ACTIONS,
    courses: CONTENT_MANAGEMENT_ACTIONS,
    cities: CONTENT_MANAGEMENT_ACTIONS,
    projects: CONTENT_MANAGEMENT_ACTIONS,
    tools: CONTENT_MANAGEMENT_ACTIONS,
    faqs: CONTENT_MANAGEMENT_ACTIONS,
    testimonials: CONTENT_MANAGEMENT_ACTIONS,
    banners: CONTENT_MANAGEMENT_ACTIONS,
    popups: CONTENT_MANAGEMENT_ACTIONS,
    media: ['create', 'read', 'update', 'delete'],
    forms: ['create', 'read', 'update', 'delete'],
    leads: ['read', 'update', 'delete', 'export'],
    redirects: ['create', 'read', 'update', 'delete'],
    menus: NAVIGATION_RESOURCE_ACTIONS,
    header: NAVIGATION_RESOURCE_ACTIONS,
    footer: NAVIGATION_RESOURCE_ACTIONS,
    settings: ['read', 'update'],
    seo: ['read', 'update'],
    users: ['create', 'read', 'update', 'delete'],
    analytics: ['read'],
    robots: ['read', 'update'],
    sitemap: ['read', 'update'],
    sections: ['create', 'read', 'update', 'delete'],
    homepage: ['read', 'update'],
    maintenance: ['read', 'update'],
  },
  editor: {
    pages: CONTENT_EDITOR_ACTIONS,
    blogs: CONTENT_EDITOR_ACTIONS,
    courses: CONTENT_EDITOR_ACTIONS,
    cities: CONTENT_EDITOR_ACTIONS,
    projects: CONTENT_EDITOR_ACTIONS,
    tools: CONTENT_EDITOR_ACTIONS,
    faqs: CONTENT_EDITOR_ACTIONS,
    testimonials: CONTENT_EDITOR_ACTIONS,
    media: ['create', 'read', 'update'],
    forms: ['create', 'read', 'update'],
    popups: ['create', 'read', 'update'],
    banners: ['create', 'read', 'update'],
    seo: ['read', 'update'],
    homepage: ['read', 'update'],
    sections: ['create', 'read', 'update', 'delete'],
  },
  author: {
    pages: CONTENT_AUTHOR_ACTIONS,
    blogs: CONTENT_AUTHOR_ACTIONS,
    courses: CONTENT_AUTHOR_ACTIONS,
    cities: CONTENT_AUTHOR_ACTIONS,
    projects: CONTENT_AUTHOR_ACTIONS,
    tools: CONTENT_AUTHOR_ACTIONS,
    faqs: CONTENT_AUTHOR_ACTIONS,
    testimonials: CONTENT_AUTHOR_ACTIONS,
    media: ['create', 'read'],
  },
  reviewer: {
    pages: CONTENT_REVIEWER_ACTIONS,
    blogs: CONTENT_REVIEWER_ACTIONS,
    courses: CONTENT_REVIEWER_ACTIONS,
    cities: CONTENT_REVIEWER_ACTIONS,
    projects: CONTENT_REVIEWER_ACTIONS,
    tools: CONTENT_REVIEWER_ACTIONS,
    faqs: CONTENT_REVIEWER_ACTIONS,
    testimonials: CONTENT_REVIEWER_ACTIONS,
    seo: ['read'],
  },
  viewer: {
    pages: READ_ONLY_ACTIONS,
    blogs: READ_ONLY_ACTIONS,
    courses: READ_ONLY_ACTIONS,
    cities: READ_ONLY_ACTIONS,
    projects: READ_ONLY_ACTIONS,
    tools: READ_ONLY_ACTIONS,
    faqs: READ_ONLY_ACTIONS,
    testimonials: READ_ONLY_ACTIONS,
    media: READ_ONLY_ACTIONS,
    forms: READ_ONLY_ACTIONS,
    leads: READ_ONLY_ACTIONS,
    redirects: READ_ONLY_ACTIONS,
    menus: READ_ONLY_ACTIONS,
    header: READ_ONLY_ACTIONS,
    footer: READ_ONLY_ACTIONS,
    settings: READ_ONLY_ACTIONS,
    seo: READ_ONLY_ACTIONS,
    analytics: READ_ONLY_ACTIONS,
    robots: READ_ONLY_ACTIONS,
    sitemap: READ_ONLY_ACTIONS,
  },
  seo_manager: {
    pages: ['read', 'update'],
    blogs: ['read', 'update'],
    courses: ['read', 'update'],
    seo: ['read', 'update'],
    analytics: ['read'],
  },
  content_writer: {
    pages: ['create', 'read', 'update'],
    blogs: ['create', 'read', 'update'],
    courses: ['create', 'read', 'update'],
    media: ['create', 'read'],
  },
}

export { CMS_ACCESS_ROLE_SLUGS, FALLBACK_ROLE_PERMISSIONS, FULL_ADMIN_ROLE_SLUGS }

export function normalizeRoleSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function mergePermissions(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return target

  for (const [resource, actions] of Object.entries(source)) {
    const resourceKey = String(resource || '').trim()
    if (!resourceKey) continue

    const normalizedActions = Array.isArray(actions)
      ? actions.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
      : []

    target[resourceKey] = Array.from(new Set([...(target[resourceKey] || []), ...normalizedActions]))
  }

  return target
}

export function extractRoleSlugs(profile = null) {
  const roleSlugs = new Set()

  const directRole = normalizeRoleSlug(profile?.role)
  if (directRole) {
    roleSlugs.add(directRole)
  }

  if (Array.isArray(profile?.effective_role_slugs)) {
    profile.effective_role_slugs.forEach((value) => {
      const slug = normalizeRoleSlug(value)
      if (slug) {
        roleSlugs.add(slug)
      }
    })
  }

  if (Array.isArray(profile?.user_roles)) {
    profile.user_roles.forEach((assignment) => {
      const roles = Array.isArray(assignment?.roles)
        ? assignment.roles
        : assignment?.roles
          ? [assignment.roles]
          : []

      roles.forEach((role) => {
        const slug = normalizeRoleSlug(role?.slug || role?.name)
        if (slug) {
          roleSlugs.add(slug)
        }
      })
    })
  }

  return Array.from(roleSlugs)
}

export function getProfilePermissions(profile = null) {
  const permissions = {}

  extractRoleSlugs(profile).forEach((slug) => {
    mergePermissions(permissions, FALLBACK_ROLE_PERMISSIONS[slug])
  })

  if (Array.isArray(profile?.user_roles)) {
    profile.user_roles.forEach((assignment) => {
      const roles = Array.isArray(assignment?.roles)
        ? assignment.roles
        : assignment?.roles
          ? [assignment.roles]
          : []

      roles.forEach((role) => {
        mergePermissions(permissions, role?.permissions)
      })
    })
  }

  return permissions
}

export function canAccessAdminProfile(profile = null) {
  return extractRoleSlugs(profile).some((slug) => CMS_ACCESS_ROLE_SLUGS.includes(slug))
}

export function isFullAdminProfile(profile = null) {
  return extractRoleSlugs(profile).some((slug) => FULL_ADMIN_ROLE_SLUGS.includes(slug))
}

export function hasProfilePermission(profile = null, resource = '', action = '') {
  if (!resource || !action) return false
  if (isFullAdminProfile(profile)) return true

  const permissions = getProfilePermissions(profile)
  const normalizedResource = String(resource).trim().toLowerCase()
  const normalizedAction = String(action).trim().toLowerCase()
  const wildcardActions = permissions['*'] || []
  const candidateResources = [normalizedResource, ...(RESOURCE_ALIASES[normalizedResource] || [])]
  const resourceActions = candidateResources.flatMap((resourceKey) => permissions[resourceKey] || [])

  return (
    wildcardActions.includes('*') ||
    wildcardActions.includes(normalizedAction) ||
    resourceActions.includes('*') ||
    resourceActions.includes(normalizedAction)
  )
}

export function enrichAdminProfile(profile = null) {
  if (!profile || typeof profile !== 'object') return profile

  const effectiveRoleSlugs = extractRoleSlugs(profile)
  const nextProfile = {
    ...profile,
    effective_role_slugs: effectiveRoleSlugs,
  }

  return {
    ...nextProfile,
    permissions: getProfilePermissions(nextProfile),
    has_admin_access: canAccessAdminProfile(nextProfile),
    is_full_admin: isFullAdminProfile(nextProfile),
  }
}

export function inferCmsPermissionFromPath(pathname = '', method = 'GET') {
  const path = String(pathname || '').toLowerCase()
  const verb = String(method || 'GET').toUpperCase()

  const resourceMap = [
    { pattern: '/api/cms/workflow', resource: 'pages' },
    { pattern: '/api/cms/users', resource: 'users' },
    { pattern: '/api/cms/leads', resource: 'leads' },
    { pattern: '/api/cms/redirects', resource: 'redirects' },
    { pattern: '/api/cms/robots', resource: 'robots' },
    { pattern: '/api/cms/sitemap', resource: 'sitemap' },
    { pattern: '/api/cms/settings', resource: 'settings' },
    { pattern: '/api/cms/header', resource: 'header' },
    { pattern: '/api/cms/footer', resource: 'footer' },
    { pattern: '/api/cms/menus', resource: 'menus' },
    { pattern: '/api/cms/seo', resource: 'seo' },
    { pattern: '/api/cms/media', resource: 'media' },
    { pattern: '/api/cms/upload', resource: 'media' },
    { pattern: '/api/cms/forms', resource: 'forms' },
    { pattern: '/api/cms/popups', resource: 'popups' },
    { pattern: '/api/cms/banners', resource: 'banners' },
    { pattern: '/api/cms/blogs', resource: 'blogs' },
    { pattern: '/api/cms/pages', resource: 'pages' },
    { pattern: '/api/cms/sections', resource: 'sections' },
    { pattern: '/api/cms/homepage', resource: 'homepage' },
    { pattern: '/api/cms/cities', resource: 'cities' },
    { pattern: '/api/cms/entities/pages', resource: 'pages' },
    { pattern: '/api/cms/entities/blogs', resource: 'blogs' },
    { pattern: '/api/cms/entities/courses', resource: 'courses' },
    { pattern: '/api/cms/entities/projects', resource: 'projects' },
    { pattern: '/api/cms/entities/tools', resource: 'tools' },
    { pattern: '/api/cms/entities/faqs', resource: 'faqs' },
    { pattern: '/api/cms/entities/testimonials', resource: 'testimonials' },
  ]

  const match = resourceMap.find((entry) => path.startsWith(entry.pattern))
  if (!match) return null

  let action = 'read'
  if (verb === 'POST') action = 'create'
  if (verb === 'PATCH' || verb === 'PUT') action = 'update'
  if (verb === 'DELETE') action = 'delete'

  return {
    resource: match.resource,
    action,
  }
}
