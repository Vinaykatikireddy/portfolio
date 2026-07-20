import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { studentApi, getApiErrorMessage } from '../services/api'
import { Button, useToast } from '../components/ui/'
import { CameraHandle, CapturedImage } from '../types'
import { Camera } from '../components/Camera'
import { Student, StudentFormData } from '../types'
import { isValidPhone, isValidEmail } from '../utils/validators'
import {
  programmeOptions,
  semesterOptions,
  regulationOptions,
  batchOptions,
  sectionOptions,
  residenceOptions,
} from '../constants/options'

const IMAGE_LIMIT = 1

const EditStudent: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<CameraHandle>(null)
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState<CapturedImage | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData | 'father_mobile', string>>>({})

  // Get student data from location state (passed from Students page)
  const student = location.state?.student as Student | null

  const [formData, setFormData] = useState({
    name: '',
    regid: '',
    gender: '',
    email: '',
    mobile: '',
    dob: '',
    programme: '',
    semester: '',
    regulation: '',
    batch: '',
    father_mobile: '',
    lab_section: '',
    class_section: '',
    residence: '',
  })

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        regid: student.regid,
        gender: student.gender,
        email: student.email,
        mobile: student.mobile,
        dob: student.dob.split('T')[0],
        programme: student.programme,
        semester: student.semester,
        regulation: student.regulation,
        batch: student.batch,
        father_mobile: student.father_mobile,
        lab_section: student.lab_section,
        class_section: student.class_section,
        residence: student.residence,
      })
      if (student.image) {
        setExistingImageUrl(student.image)
      }
    } else {
      navigate('/students-section')
    }
  }, [student, navigate])

  const handleImagesChange = (newImages: CapturedImage[]) => {
    setImage(newImages.length > 0 ? newImages[0] : null)
  }

  const removeImage = () => {
    if (image) {
      if (image.url) {
        try { URL.revokeObjectURL(image.url) } catch {}
      }
      setImage(null)
      cameraRef.current?.clearImages()
    }
  }

  const openCamera = () => {
    cameraRef.current?.open()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (image?.url) {
      try { URL.revokeObjectURL(image.url) } catch {}
    }
    setImage({
      id: crypto.randomUUID(),
      blob: file,
      url: URL.createObjectURL(file),
    } as CapturedImage)
    e.target.value = ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.regid.trim()) newErrors.regid = 'Reg ID is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!isValidEmail(formData.email)) newErrors.email = 'Valid email is required'
    if (!isValidPhone(formData.mobile)) newErrors.mobile = 'Valid 10-digit mobile number is required'
    if (!formData.dob) newErrors.dob = 'Date of birth is required'
    if (!formData.programme) newErrors.programme = 'Programme is required'
    if (!formData.semester) newErrors.semester = 'Semester is required'
    if (!formData.regulation) newErrors.regulation = 'Regulation is required'
    if (!formData.batch) newErrors.batch = 'Batch is required'
    if (!isValidPhone(formData.father_mobile)) newErrors.father_mobile = "Valid father's mobile is required"
    if (!formData.lab_section) newErrors.lab_section = 'Lab section is required'
    if (!formData.class_section) newErrors.class_section = 'Class section is required'
    if (!formData.residence) newErrors.residence = 'Residence is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.warning('Please fix the form errors')
      return
    }

    setSaving(true)

    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key === 'father_mobile' ? 'fatherMobile' : key, value)
      })
      formDataToSend.append('oldregid', student!.regid)

      if (image?.blob) {
        formDataToSend.append('image', image.blob, 'profile.jpg')
      }

      await studentApi.update(formDataToSend)
      toast.success('Student updated successfully!')
      navigate('/students-section')
    } catch (err: any) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fade-in-up">
      <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
        <i className="fas fa-user-edit text-fras-gold" />
        Edit Student
      </h1>

      <div className="bg-white rounded-lg shadow-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Photo</h3>

            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="flex-shrink-0">
                {(image || existingImageUrl) ? (
                  <div className="relative">
                    <img
                      src={image?.url || existingImageUrl || ''}
                      alt="Profile"
                      className="w-32 h-32 rounded-lg object-cover border-2 border-fras-gold shadow-md"
                    />
                    {image && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow"
                        title="Remove new photo, keep existing"
                      >
                        <i className="fas fa-times text-xs" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
                    <i className="fas fa-user text-3xl text-gray-300 mb-1" />
                    <span className="text-xs text-gray-400">No photo</span>
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={openCamera}
                    className="px-4 py-2 bg-fras-gold text-white rounded-lg hover:bg-fras-gold-dark transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-camera" />
                    Take new Photo
                  </button>
                  <span style={{ alignSelf: 'center' }}>OR</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-upload" />
                    Upload
                  </button>
                </div>
                <p className="text-xs text-gray-500">Replace with a new photo, or leave as is.</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileUpload}
            />

            <Camera
              ref={cameraRef}
              onImagesChange={handleImagesChange}
              maxImages={IMAGE_LIMIT}
              showPreview={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration ID *</label>
              <input
                type="text"
                name="regid"
                value={formData.regid}
                onChange={handleChange}
                required
                className={`form-input ${errors.regid ? 'border-red-500' : ''}`}
              />
              {errors.regid && <p className="mt-1 text-sm text-red-600">{errors.regid}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className={`form-select ${errors.gender ? 'border-red-500' : ''}`}
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile *</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                pattern="[0-9]{10}"
                required
                className={`form-input ${errors.mobile ? 'border-red-500' : ''}`}
              />
              {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className={`form-input ${errors.dob ? 'border-red-500' : ''}`}
              />
              {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Programme *</label>
              <select
                name="programme"
                value={formData.programme}
                onChange={handleChange}
                required
                className={`form-select ${errors.programme ? 'border-red-500' : ''}`}
              >
                {programmeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.programme && <p className="mt-1 text-sm text-red-600">{errors.programme}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
                className={`form-select ${errors.semester ? 'border-red-500' : ''}`}
              >
                {semesterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Regulation *</label>
              <select
                name="regulation"
                value={formData.regulation}
                onChange={handleChange}
                required
                className={`form-select ${errors.regulation ? 'border-red-500' : ''}`}
              >
                {regulationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.regulation && <p className="mt-1 text-sm text-red-600">{errors.regulation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch *</label>
              <select
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                required
                className={`form-select ${errors.batch ? 'border-red-500' : ''}`}
              >
                {batchOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.batch && <p className="mt-1 text-sm text-red-600">{errors.batch}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Father's Mobile *</label>
              <input
                type="tel"
                name="father_mobile"
                value={formData.father_mobile}
                onChange={handleChange}
                pattern="[0-9]{10}"
                required
                className={`form-input ${errors.father_mobile ? 'border-red-500' : ''}`}
              />
              {errors.father_mobile && <p className="mt-1 text-sm text-red-600">{errors.father_mobile}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lab Section *</label>
              <select
                name="lab_section"
                value={formData.lab_section}
                onChange={handleChange}
                required
                className={`form-select ${errors.lab_section ? 'border-red-500' : ''}`}
              >
                <option value="">Select Lab Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
              {errors.lab_section && <p className="mt-1 text-sm text-red-600">{errors.lab_section}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Section *</label>
              <select
                name="class_section"
                value={formData.class_section}
                onChange={handleChange}
                required
                className={`form-select ${errors.class_section ? 'border-red-500' : ''}`}
              >
                {sectionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.class_section && <p className="mt-1 text-sm text-red-600">{errors.class_section}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Residence *</label>
              <select
                name="residence"
                value={formData.residence}
                onChange={handleChange}
                required
                className={`form-select ${errors.residence ? 'border-red-500' : ''}`}
              >
                {residenceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.residence && <p className="mt-1 text-sm text-red-600">{errors.residence}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              className="text-yellow-500"
              onClick={() => navigate('/students')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={saving}
            >
              <i className="fas fa-save" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditStudent