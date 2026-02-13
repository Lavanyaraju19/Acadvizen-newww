import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export function StudentsAdmin() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setStudents(data)
    setLoading(false)
  }

  async function handleApprove(student, role = 'student') {
    if (!confirm(`Approve ${student.email} as ${role}?`)) return
    try {
      await supabase
        .from('profiles')
        .update({ approval_status: 'approved', role })
        .eq('id', student.id)
      console.log(`Email sent to ${student.email}: Your account has been approved!`)
      loadStudents()
      alert('Student approved successfully!')
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  async function handleReject(student) {
    if (!confirm(`Reject ${student.email}?`)) return
    await supabase
      .from('profiles')
      .update({ approval_status: 'rejected' })
      .eq('id', student.id)
    console.log(`Email sent to ${student.email}: Your account application has been rejected.`)
    loadStudents()
    alert('Student rejected.')
  }

  async function handleRoleChange(student, newRole) {
    if (!confirm(`Change ${student.email} role to ${newRole}?`)) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', student.id)
    loadStudents()
  }

  const filtered = students.filter((s) => {
    const matchSearch =
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.approval_status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Student Management</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by email, name, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.full_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.student_id || '-'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={student.role}
                        onChange={(e) => handleRoleChange(student, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="student">Student</option>
                        <option value="sales">Sales</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          student.approval_status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : student.approval_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {student.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {student.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(student, student.role)}
                            className="text-green-600 hover:text-green-800 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(student)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {student.approval_status === 'approved' && (
                        <span className="text-gray-400">Approved</span>
                      )}
                      {student.approval_status === 'rejected' && (
                        <button
                          onClick={() => handleApprove(student, student.role)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Re-approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filtered.length} of {students.length} students
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
