import { useState, memo, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentApi, attendanceApi } from '../services/api'
import { Button, Input, Modal } from '../components/ui/'
import { Student, AttendanceRecord } from '../types/'

const Students = memo(() => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const navigate = useNavigate();

  const loadStudents = async (query: string = '') => {
    setLoading(true)
    setError(null)
    try {
      //query = query.toUpperCase()
      const response = await studentApi.search(query)
      setStudents(response.data)
    } catch (err: any) {
      setError('Failed to load students')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    loadStudents(searchQuery)
  }

  const handleDelete = (regid: string) => {
    setDeleteCandidate(regid)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteCandidate) return
    try {
      setIsDeleteModalOpen(false)
      setStudents(prev => prev.filter(s => s.regid !== deleteCandidate))
      await studentApi.delete(deleteCandidate)
      setDeleteCandidate(null)
    } catch (err: any) {
      alert('Failed to delete student: ' + err.message)
    }
  }

  const handleViewAttendance = (regid: string) => {
    setIsAttendanceModalOpen(true)
    fetchAttendanceData(regid)
  }

  const fetchAttendanceData = async (regid: string) => {
    setAttendanceLoading(true)
    setAttendanceError(null)
    try {
      const response = await attendanceApi.getAttendanceSummary(regid)
      setAttendanceData(response.data)
    } catch (err: any) {
      setAttendanceError('Failed to load attendance data')
      console.error(err)
    } finally {
      setAttendanceLoading(false)
    }
  }

  return (
    <div className="fade-in-up">
      <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
        <i className="fas fa-users text-fras-gold" />
        Students List
      </h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search student by name, regID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-fras-navy text-gold placeholder-gold/50 border-gold"
            minLength={3}
            required
          />
        </div>
        <Button type="submit" variant="primary">
          <i className="fas fa-search" />
          Search
        </Button>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-fras-gold" />
          <p className="text-white mt-4">Loading students...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Students Table */}
      {!loading && !error && students.length === 0 && (
        <div className="bg-white rounded-lg shadow-xl p-12 text-center">
          <i className="fas fa-users text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No students found</p>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="table-container overflow-visible [transform:rotateX(180deg)]">
          <table className="table-base min-w-[1600px] [transform:rotateX(180deg)]">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">Id</th>
                <th className="table-header">Image</th>
                <th className="table-header">Actions</th>
                <th className="table-header">Name</th>
                <th className="table-header">Reg ID</th>
                <th className="table-header">Gender</th>
                <th className="table-header">Email</th>
                <th className="table-header">Mobile</th>
                <th className="table-header">DOB</th>
                <th className="table-header">Programme</th>
                <th className="table-header">Semester</th>
                <th className="table-header">Regulation</th>
                <th className="table-header">Batch</th>
                <th className="table-header">Father's Mobile</th>
                <th className="table-header">Lab Section</th>
                <th className="table-header">Class Section</th>
                <th className="table-header">Residence</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.regid} className="table-row border-b border-gray-100 hover:bg-fras-gold/10 transition-colors">
                  <td className="table-cell">{index + 1}</td>
                  <td className="table-cell">
  {student.image ? (
    <div className="relative group w-12 h-12">
      <img
        src={student.image}
        alt={student.name}
        className="
          w-12 h-12
          object-cover
          rounded-lg
          border-2 border-fras-gold
          transition-all duration-300
          group-hover:scale-[3]
          group-hover:absolute
          group-hover:top-0
          group-hover:left-0
          group-hover:z-50
          group-hover:shadow-2xl
        "
      />
    </div>
  ) : (
    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
      <i className="fas fa-user text-gray-400" />
    </div>
  )}
</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                       <button
                         onClick={() => handleViewAttendance(student.regid)}
                         className="w-9 h-9 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                         title="View Attendance"
                       >
                         <i className="fas fa-eye" />
                       </button>
                      <button
                        onClick={() => navigate("/edit-student", {state:{student}}) }
                        className="w-9 h-9 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                        title="Edit Student"
                      >
                        <i className="fas fa-edit" />
                      </button>
                       <button
                         onClick={() => handleDelete(student.regid)}
                         className="w-9 h-9 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                         title="Delete Student"
                       >
                         <i className="fas fa-trash" />
                       </button>
                    </div>
                  </td>
                  <td className="table-cell font-medium">{student.name}</td>
                  <td className="table-cell">{student.regid}</td>
                  <td className="table-cell">{student.gender}</td>
                  <td className="table-cell">{student.email}</td>
                  <td className="table-cell">{student.mobile}</td>
                  <td className="table-cell">{student.dob.split('T')[0]}</td>
                  <td className="table-cell">{student.programme}</td>
                  <td className="table-cell">{student.semester}</td>
                  <td className="table-cell">{student.regulation}</td>
                  <td className="table-cell">{student.batch}</td>
                  <td className="table-cell">{student.father_mobile}</td>
                  <td className="table-cell">{student.lab_section}</td>
                  <td className="table-cell">{student.class_section}</td>
                  <td className="table-cell capitalize">{student.residence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={
          <>
            <i className="fas fa-exclamation-triangle text-red-500" />
            <span>Confirm Delete</span>
          </>
        }
        footer={
          <>
            <Button
              variant="secondary"
              className="text-yellow-500"
              onClick={() => setIsDeleteModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              type="button"
            >
              <i className="fas fa-trash" />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete student with Reg ID: <strong>{deleteCandidate}</strong>?
        </p>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title=
          <>
            <i className="fas fa-calendar-check text-green-500" />
            <span>Attendance Summary</span>
          </>
      >
        {attendanceLoading && (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-fras-gold" />
            <p className="text-gray-600 mt-4">Loading attendance data...</p>
          </div>
        )}
        
        {attendanceError && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-500">{attendanceError}</p>
          </div>
        )}
        
        {!attendanceLoading && !attendanceError && attendanceData && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Periods</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-4 whitespace-nowrap">{attendanceData.total_working_periods}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{attendanceData.attended_periods}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attendanceData.total_working_periods > 0
                      ? (attendanceData.attended_periods * 100) / attendanceData.total_working_periods
                      : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
        {!attendanceLoading && !attendanceError && !attendanceData && (
          <div className="text-center py-12">
            <i className="fas fa-exclamation-circle text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No attendance data available</p>
          </div>
        )}
      </Modal>

      </div>
  )
})

export default Students