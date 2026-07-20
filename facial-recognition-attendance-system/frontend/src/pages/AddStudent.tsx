import { useState, useRef } from 'react'
import { studentApi } from '../services/api'
import { getApiErrorMessage } from '../services/api'
import { Button, useToast } from '../components/ui/'
import type { CameraHandle, CapturedImage, StudentFormData } from '../types'
import { Camera } from '../components/Camera'
import { isValidPhone, isValidEmail } from '../utils/validators'
import {
  programmeOptions,
  semesterOptions,
  regulationOptions,
  batchOptions,
  sectionOptions,
  residenceOptions,
} from '../constants/options'

const PROFILE_IMAGE_LIMIT = 1
const FACE_RECOGNITION_LIMIT = 10

const AddStudent = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profileCameraRef = useRef<CameraHandle>(null)
  const faceRecognitionCameraRef = useRef<CameraHandle>(null)
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [embeddingLoading, setEmbeddingLoading] = useState(false)
  const [image, setImage] = useState<CapturedImage | null>(null)
  const [faceRecognitionImages, setFaceRecognitionImages] = useState<CapturedImage[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({})

  const [formData, setFormData] = useState<StudentFormData>({
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
    fatherMobile: '',
    lab_section: '',
    class_section: '',
    residence: '',
  })

  const handleProfileImagesChange = (newImages: CapturedImage[]) => {
    setImage(newImages.length > 0 ? newImages[0] : null)
  }

  const removeImage = () => {
    if (image?.url) {
      try { URL.revokeObjectURL(image.url) } catch {}
    }
    setImage(null)
    profileCameraRef.current?.clearImages()
  }
  
  const removeFaceRecognitionImages = () => {
    faceRecognitionImages.forEach(img => {
      try { URL.revokeObjectURL(img.url) } catch {}
    })
    setFaceRecognitionImages([])
    faceRecognitionCameraRef.current?.clearImages()
  }

  const openProfileCamera = () => {
    if (profileCameraRef.current) {
      profileCameraRef.current.open()
    }
  }
  
  const openFaceRecognitionCamera = () => {
    if (faceRecognitionCameraRef.current) {
      faceRecognitionCameraRef.current.open()
    }
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
    // Reset file input so same file can be re-selected
    e.target.value = ''
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {}

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
    if (!isValidPhone(formData.fatherMobile)) newErrors.fatherMobile = 'Valid father\'s mobile is required'
    if (!formData.lab_section) newErrors.lab_section = 'Lab section is required'
    if (!formData.class_section) newErrors.class_section = 'Class section is required'
    if (!formData.residence) newErrors.residence = 'Residence is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateEmbedding = async () => {
    if (faceRecognitionImages.length === 0) {
      toast.warning('Please capture at least one face recognition photo')
      return
    }
    
    if (!formData.regid) {
      toast.warning('Please enter Reg ID first')
      return
    }
    
    setEmbeddingLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('regid', formData.regid)
      
      // Append all images
      faceRecognitionImages.forEach((img, index) => {
        formDataToSend.append('images', img.blob, `face_${index}.jpg`)
      })
      
      const response = await studentApi.generateEmbedding(formDataToSend)
      
      // Store the embedding in state to send with the main form
      setFormData(prev => ({ ...prev, embedding: JSON.stringify(response.data.embedding) }))
      
      toast.success('Face recognition embedding generated successfully!')
      
    } catch (err: any) {
      console.error('Error generating embedding:', err)
      toast.error(getApiErrorMessage(err))
    } finally {
      setEmbeddingLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.warning('Please fix the form errors')
      return
    }

    if (!image) {
      toast.warning('Please add a profile photo')
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'embedding' && value) {
          formDataToSend.append(key, value)
        }
      })
      
      // Add embedding if it exists
      if (formData.embedding) {
        formDataToSend.append('embedding', formData.embedding)
      }

      formDataToSend.append('image', image.blob, 'profile.jpg')

      await studentApi.create(formDataToSend)
      
      toast.success('Student added successfully!')
      removeImage()
      removeFaceRecognitionImages()
      setFormData({
        name: '', regid: '', gender: '', email: '', mobile: '', dob: '',
        programme: '', semester: '', regulation: '', batch: '',
        fatherMobile: '', lab_section: '', class_section: '', residence: '',
        embedding: ''
      })
      setErrors({})
      
    } catch (err: any) {
      console.error('Error adding student:', err)
      toast.error(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof StudentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="fade-in-up">
      <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
        <i className="fas fa-user-plus text-fras-gold" />
        Add New Student
      </h1>

      <div className="bg-white rounded-lg shadow-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Photo</h3>
            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="flex-shrink-0">
                {image ? (
                  <div className="relative group">
                    <img
                      src={image.url}
                      alt="Profile"
                      className="w-32 h-32 rounded-lg object-cover border-2 border-fras-gold shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-times text-xs" />
                    </button>
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={openProfileCamera}
                    className="w-full sm:w-auto px-4 py-2 bg-fras-gold text-white rounded-lg hover:bg-fras-gold-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-camera" />
                    Take New Photo
                  </button>
                            
                  <span className="text-center text-gray-500">OR</span>
                            
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-upload" />
                    Upload
                  </button>
                </div>
                            
                <p className="text-xs text-gray-500">
                  Clear front-facing photo. JPG/PNG accepted.
                </p>
              </div>
            </div>
             <input
               ref={fileInputRef}
               type="file"
               accept="image/jpeg,image/png"
               className="hidden"
               onChange={handleFileUpload}
             />
           </div>

           {/* Personal Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reg ID *</label>
                <input
                  type="text"
                  name="regid"
                  value={formData.regid}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.regid ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter registration ID"
                />
                {errors.regid && <p className="mt-1 text-sm text-red-600">{errors.regid}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.dob ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="student@email.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.mobile ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                />
                {errors.mobile && <p className="mt-1 text-sm text-red-600">{errors.mobile}</p>}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programme *</label>
                <select
                  name="programme"
                  value={formData.programme}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.programme ? 'border-red-500' : 'border-gray-300'}`}
                >
                  {programmeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.programme && <p className="mt-1 text-sm text-red-600">{errors.programme}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.semester ? 'border-red-500' : 'border-gray-300'}`}
                >
                  {semesterOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.semester && <p className="mt-1 text-sm text-red-600">{errors.semester}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Regulation *</label>
                <select
                  name="regulation"
                  value={formData.regulation}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.regulation ? 'border-red-500' : 'border-gray-300'}`}
                >
                  {regulationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.regulation && <p className="mt-1 text-sm text-red-600">{errors.regulation}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.batch ? 'border-red-500' : 'border-gray-300'}`}
                >
                  {batchOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.batch && <p className="mt-1 text-sm text-red-600">{errors.batch}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab Section *</label>
                <select
                  name="lab_section"
                  value={formData.lab_section}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.lab_section ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Lab Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
                {errors.lab_section && <p className="mt-1 text-sm text-red-600">{errors.lab_section}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Section *</label>
                <select
                  name="class_section"
                  value={formData.class_section}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.class_section ? 'border-red-500' : 'border-gray-300'}`}
                >
                  {sectionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.class_section && <p className="mt-1 text-sm text-red-600">{errors.class_section}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residence *</label>
                <select
                  name="residence"
                  value={formData.residence}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.residence ? 'border-red-500' : 'border-gray-300'}`}
                >
                  {residenceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.residence && <p className="mt-1 text-sm text-red-600">{errors.residence}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Mobile *</label>
                <input
                  type="tel"
                  name="fatherMobile"
                  value={formData.fatherMobile}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fras-gold focus:border-transparent ${errors.fatherMobile ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                />
                {errors.fatherMobile && <p className="mt-1 text-sm text-red-600">{errors.fatherMobile}</p>}
              </div>
            </div>
          </div>

          {/* Face Recognition Photos */}
           <div className="border-b border-gray-200 pb-6">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Face Recognition Photos</h3>
             <div className="flex flex-col gap-4">
               <Camera ref={faceRecognitionCameraRef} onImagesChange={setFaceRecognitionImages} maxImages={FACE_RECOGNITION_LIMIT} showPreview={true} />
               <div className="flex items-start gap-6">
                   <div className="flex gap-3">
                     <button
                       type="button"
                       onClick={openFaceRecognitionCamera}
                       className="px-4 py-2 bg-fras-blue text-white rounded-lg hover:bg-fras-blue-dark transition-colors flex items-center gap-2"
                     >
                       <i className="fas fa-camera" />
                       Take Photos
                     </button>
                     {faceRecognitionImages.length > 0 && (
                       <button
                         type="button"
                         onClick={removeFaceRecognitionImages}
                         className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                       >
                         <i className="fas fa-trash" />
                         Clear All
                       </button>
                     )}
                   </div>
                   <p className="text-xs text-gray-500">Capture 1-10 photos from different angles for face recognition.</p>
               </div>
               <div className="flex justify-end">
                 <Button
                   type="button"
                   variant="secondary"
                   onClick={generateEmbedding}
                   isLoading={embeddingLoading}
                   disabled={faceRecognitionImages.length === 0}
                 >
                   <i className="fas fa-robot mr-2" />
                   {embeddingLoading ? 'Generating Embedding...' : 'Generate Face Recognition Embedding'}
                 </Button>
               </div>
             </div>
           </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              className="text-yellow-500"
              onClick={() => {
                removeImage()
                removeFaceRecognitionImages()
                setFormData({
                  name: '', regid: '', gender: '', email: '', mobile: '', dob: '',
                  programme: '', semester: '', regulation: '', batch: '',
                  fatherMobile: '', lab_section: '', class_section: '', residence: '',
                  embedding: ''
                })
                setErrors({})
              }}
            >
              <i className="fas fa-times mr-2" />
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
            >
              <i className="fas fa-save mr-2" />
              {loading ? 'Adding Student...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </div>
      <Camera ref={profileCameraRef} onImagesChange={handleProfileImagesChange} maxImages={PROFILE_IMAGE_LIMIT} showPreview={false} />
    </div>
  )
}

export default AddStudent