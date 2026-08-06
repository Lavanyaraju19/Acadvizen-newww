'use client'

import { useState, useEffect } from 'react'
import { Surface } from '../../../src/components/ui/Surface'
import { adminApiFetch } from '../../../lib/adminApiClient'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Shield, 
  User, 
  Mail, 
  Calendar,
  Check,
  X,
  ChevronDown,
  Search,
  Filter
} from 'lucide-react'

const PERMISSION_CATEGORIES = {
  pages: { label: 'Pages', actions: ['create', 'read', 'update', 'delete', 'publish'] },
  blogs: { label: 'Blogs', actions: ['create', 'read', 'update', 'delete', 'publish'] },
  courses: { label: 'Courses', actions: ['create', 'read', 'update', 'delete', 'publish'] },
  media: { label: 'Media', actions: ['create', 'read', 'update', 'delete'] },
  forms: { label: 'Forms', actions: ['create', 'read', 'update', 'delete'] },
  popups: { label: 'Popups', actions: ['create', 'read', 'update', 'delete'] },
  banners: { label: 'Banners', actions: ['create', 'read', 'update', 'delete'] },
  settings: { label: 'Settings', actions: ['read', 'update'] },
  users: { label: 'Users', actions: ['create', 'read', 'update', 'delete'] },
  roles: { label: 'Roles', actions: ['create', 'read', 'update', 'delete'] },
  seo: { label: 'SEO', actions: ['read', 'update'] },
  analytics: { label: 'Analytics', actions: ['read'] },
  backup: { label: 'Backup', actions: ['create', 'restore'] },
}

export default function UserManagerClient() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: '',
    password: '',
  })

  const [roleForm, setRoleForm] = useState(createEmptyRoleForm())
  const [savingRole, setSavingRole] = useState(false)

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  function createEmptyRoleForm() {
    return { id: '', name: '', slug: '', description: '', permissions: {} }
  }

  function beginCreateRole() {
    setRoleForm(createEmptyRoleForm())
  }

  function beginEditRole(role) {
    setRoleForm({
      id: role.id,
      name: role.name || '',
      slug: role.slug || '',
      description: role.description || '',
      permissions: role.permissions && typeof role.permissions === 'object' ? role.permissions : {},
    })
  }

  function toggleRolePermission(resource, action) {
    setRoleForm((prev) => {
      const current = new Set(Array.isArray(prev.permissions?.[resource]) ? prev.permissions[resource] : [])
      if (current.has(action)) current.delete(action)
      else current.add(action)
      return {
        ...prev,
        permissions: { ...prev.permissions, [resource]: Array.from(current) },
      }
    })
  }

  async function handleSaveRole(event) {
    event.preventDefault()
    if (!roleForm.name.trim()) {
      setStatus('Role name is required.')
      return
    }
    setSavingRole(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/entities/roles${roleForm.id ? `/${roleForm.id}` : ''}`, {
        method: roleForm.id ? 'PATCH' : 'POST',
        body: {
          name: roleForm.name.trim(),
          slug: roleForm.slug.trim() || undefined,
          description: roleForm.description || '',
          permissions: roleForm.permissions || {},
        },
      })
      setStatus(roleForm.id ? 'Role updated successfully.' : 'Role created successfully.')
      beginCreateRole()
      await loadRoles()
    } catch (error) {
      setStatus(error?.message || 'Failed to save role.')
    } finally {
      setSavingRole(false)
    }
  }

  async function handleDeleteRole(role) {
    if (role.is_system_role) {
      setStatus('Built-in system roles cannot be deleted.')
      return
    }
    if (!window.confirm(`Delete the "${role.name}" role? Users assigned to it will need a new role.`)) return
    setSavingRole(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/entities/roles/${role.id}`, { method: 'DELETE' })
      setStatus('Role deleted successfully.')
      if (roleForm.id === role.id) beginCreateRole()
      await loadRoles()
    } catch (error) {
      setStatus(error?.message || 'Failed to delete role.')
    } finally {
      setSavingRole(false)
    }
  }

  async function loadUsers() {
    try {
      const json = await adminApiFetch('/api/cms/users?limit=100', { cache: 'no-store' })
      setUsers(Array.isArray(json.data) ? json.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load users.')
    }
  }

  async function loadRoles() {
    try {
      const payload = await adminApiFetch('/api/cms/entities/roles?limit=100', { cache: 'no-store' })
      setRoles(Array.isArray(payload?.data) ? payload.data : [])
    } catch (error) {
      setStatus(error?.message || 'Failed to load roles.')
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault()
    if (!newUser.email) {
      setStatus('Email is required.')
      return
    }

    setLoading(true)
    setStatus('')
    try {
      await adminApiFetch('/api/cms/users', {
        method: 'POST',
        body: newUser,
      })
      setStatus('User created successfully.')
      setShowCreateModal(false)
      setNewUser({ email: '', full_name: '', role: '', password: '' })
      await loadUsers()
    } catch (error) {
      setStatus(error?.message || 'Failed to create user.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return

    setLoading(true)
    setStatus('')
    try {
      await adminApiFetch(`/api/cms/users/${userId}`, { method: 'DELETE' })
      setStatus('User deleted successfully.')
      await loadUsers()
    } catch (error) {
      setStatus(error?.message || 'Failed to delete user.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignRole(userId, roleSlug) {
    if (!roleSlug) return
    setLoading(true)
    setStatus('')
    try {
      // PATCH /api/cms/users/[id] is the real, implemented endpoint - it expects a role
      // slug (e.g. "editor"), not a roles.id, and it's also what enforces the
      // last-super-admin protection. There is no /users/[id]/roles endpoint.
      await adminApiFetch(`/api/cms/users/${userId}`, {
        method: 'PATCH',
        body: { role: roleSlug },
      })
      setStatus('Role assigned successfully.')
      await loadUsers()
    } catch (error) {
      setStatus(error?.message || 'Failed to assign role.')
    } finally {
      setLoading(false)
    }
  }

  function getUserRole(user) {
    if (!user.user_roles || user.user_roles.length === 0) return null
    return user.user_roles[0]?.roles
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const userRole = getUserRole(user)
    const matchesRole = roleFilter === 'all' || userRole?.slug === roleFilter
    
    return matchesSearch && matchesRole
  })

  return (
    <Surface className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-50">User Management</h2>
          <p className="mt-1 text-sm text-slate-300">Manage users and their permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { beginCreateRole(); setShowRoleModal(true) }}
            className="px-4 py-2 rounded-xl border border-white/10 text-slate-200 hover:bg-white/[0.05]"
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Manage Roles
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-300 text-slate-950 hover:bg-teal-200"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
              />
            </div>
          </div>
          <div className="min-w-[200px]">
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.slug}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {status && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-300">
          {status}
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const userRole = getUserRole(user)
                return (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-100">{user.full_name || 'Unknown'}</div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Role for ${user.full_name || user.email || 'user'}`}
                        value={userRole?.slug || user.role || ''}
                        onChange={(e) => handleAssignRole(user.id, e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                      >
                        {roles.map(role => (
                          <option key={role.id} value={role.slug}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-slate-500/20 text-slate-300'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 rounded-lg border border-rose-400/30 text-rose-400 hover:bg-rose-500/10"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-100">Add New User</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  placeholder="Leave blank for auto-generated"
                />
              </div>

              <div>
                <label htmlFor="new-user-role" className="block text-xs text-slate-400 mb-2">Role</label>
                <select
                  id="new-user-role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                >
                  <option value="">Select a role (defaults to Viewer)</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.slug}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Roles Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl border border-white/10 bg-[#050b12] p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Manage Roles</h3>
                <p className="mt-1 text-sm text-slate-400">Create custom roles with exact per-module permissions, or edit an existing one.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => beginEditRole(role)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                    roleForm.id === role.id
                      ? 'border-teal-400/50 bg-teal-500/10 text-teal-200'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  {role.name}
                  {role.is_system_role ? <span className="opacity-60">(built-in)</span> : null}
                </button>
              ))}
              <button
                type="button"
                onClick={beginCreateRole}
                className="rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                + New Role
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Slug (auto-generated if left blank)</label>
                  <input
                    type="text"
                    value={roleForm.slug}
                    onChange={(e) => setRoleForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Description</label>
                <input
                  type="text"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/[0.03] text-slate-100"
                />
              </div>

              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Module</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Permissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(PERMISSION_CATEGORIES).map(([resource, { label, actions }]) => (
                      <tr key={resource} className="border-b border-white/5">
                        <td className="px-3 py-2 text-slate-200">{label}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-3">
                            {actions.map((action) => {
                              const checked = Array.isArray(roleForm.permissions?.[resource]) && roleForm.permissions[resource].includes(action)
                              return (
                                <label key={action} className="flex items-center gap-1.5 text-xs text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleRolePermission(resource, action)}
                                    className="rounded border-white/20 bg-white/[0.03]"
                                  />
                                  {action}
                                </label>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingRole}
                  className="flex-1 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 disabled:opacity-50"
                >
                  {savingRole ? 'Saving...' : roleForm.id ? 'Update Role' : 'Create Role'}
                </button>
                {roleForm.id ? (
                  <button
                    type="button"
                    disabled={savingRole}
                    onClick={() => handleDeleteRole(roles.find((role) => role.id === roleForm.id))}
                    className="px-4 py-2 rounded-xl border border-rose-400/30 text-rose-200 hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.05]"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Surface>
  )
}
