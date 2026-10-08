// Next.js data-cache tags for WordPress content (shared by loaders and the signed webhook).
export const BLOG_LIST_TAG = 'wordpress:blogs'
export const blogTag = (slug) => `wordpress:blog:${slug}`

export const MANIFEST_TAG = 'wordpress:manifest'
export const PAGES_TAG = 'wordpress:pages'
export const pageTag = (path) => `wordpress:page:${path}`
