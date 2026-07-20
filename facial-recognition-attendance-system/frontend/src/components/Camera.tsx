import { useRef, useState, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
export interface CapturedImage {
  id: string
  blob: Blob
  url: string
}

export interface CameraHandle {
  open: () => void
  close: () => void
  getImages: () => CapturedImage[]
  clearImages: () => void
}

interface CameraProps {
  onImagesChange?: (images: CapturedImage[]) => void
  maxImages?: number
  showPreview?: boolean
}

// Target dimensions for optimized images
const TARGET_WIDTH = 640
const TARGET_HEIGHT = 480
const JPEG_QUALITY = 0.75

export const Camera = forwardRef<CameraHandle, CameraProps>(
  ({ onImagesChange, maxImages, showPreview = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [images, setImages] = useState<CapturedImage[]>([])
    const [error, setError] = useState<string | null>(null)

    // Cleanup stream on unmount
    useEffect(() => {
      return () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
      }
    }, [stream])

    // Cleanup all URLs on unmount
    useEffect(() => {
      return () => {
        images.forEach(img => {
          try {
            URL.revokeObjectURL(img.url)
          } catch (err) {
            console.warn('Failed to revoke URL:', err)
          }
        })
      }
    }, [])

    const stopStream = useCallback(() => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
    }, [stream])

    const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
      try {
        stopStream()

        let newStream: MediaStream
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: mode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })
        } catch {
          newStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })
        }

        setStream(newStream)
        if (videoRef.current) {
          videoRef.current.srcObject = newStream
          videoRef.current.style.transform = mode === 'user' ? 'scaleX(-1)' : 'scaleX(1)'
        }
        setError(null)
      } catch (err: any) {
        console.error('Camera error:', err)
        let errorMessage = 'Failed to access camera.'
        
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.'
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.'
        }
        
        setError(errorMessage)
      }
    }, [facingMode, stopStream])

    const open = useCallback(() => {
      setIsOpen(true)
      startCamera(facingMode)
    }, [startCamera, facingMode])

    const close = useCallback(() => {
      setIsOpen(false)
      stopStream()
    }, [stopStream])

    const toggleCamera = useCallback(() => {
      const newMode = facingMode === 'user' ? 'environment' : 'user'
      setFacingMode(newMode)
      startCamera(newMode)
    }, [facingMode, startCamera])

    const capturePhoto = useCallback(() => {
      if (!videoRef.current) return
      if (maxImages && images.length >= maxImages) return

      const video = videoRef.current
      const canvas = document.createElement('canvas')
      
      // Resize to target dimensions for optimization
      const scale = Math.min(TARGET_WIDTH / video.videoWidth, TARGET_HEIGHT / video.videoHeight)
      canvas.width = video.videoWidth * scale
      canvas.height = video.videoHeight * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.save()
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.restore()

      canvas.toBlob((blob) => {
        if (!blob) return

        const id = crypto.randomUUID()
        const url = URL.createObjectURL(blob)
        const newImage: CapturedImage = { id, blob, url }

        setImages(prev => {
          const updated = [...prev, newImage]
          onImagesChange?.(updated)
          return updated
        })
      }, 'image/jpeg', JPEG_QUALITY)
    }, [facingMode, onImagesChange])

    const deleteImage = useCallback((id: string) => {
      setImages(prev => {
        const image = prev.find(img => img.id === id)
        if (image) {
          try {
            URL.revokeObjectURL(image.url)
          } catch (err) {
            console.warn('Failed to revoke URL:', err)
          }
        }
        const updated = prev.filter(img => img.id !== id)
        onImagesChange?.(updated)
        return updated
      })
    }, [onImagesChange])

    const getImages = useCallback(() => images, [images])

    const clearImages = useCallback(() => {
      images.forEach(img => {
        try {
          URL.revokeObjectURL(img.url)
        } catch (err) {
          console.warn('Failed to revoke URL:', err)
        }
      })
      setImages([])
      onImagesChange?.([])
    }, [images, onImagesChange])

    useImperativeHandle(ref, () => ({
      open,
      close,
      getImages,
      clearImages
    }), [open, close, getImages, clearImages])

    const handleCloseModal = () => {
      close()
    }

    return (
      <>
        {showPreview && images.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4">
            {images.map((image) => (
              <div key={image.id} className="relative inline-block group">
                <img
                  src={image.url}
                  alt="Captured"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-fras-gold"
                />
                <button
                  onClick={() => deleteImage(image.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={isOpen}
          onClose={handleCloseModal}
          title={
            <>
              <i className="fas fa-camera text-fras-gold" />
              <span>Capture Photos</span>
            </>
          }
          size="lg"
          footer={
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="secondary"
                className='text-yellow-500'
                onClick={toggleCamera}
                type="button"
              >
                <i className="fas fa-camera-rotate" />
                Switch Camera
              </Button>
              <Button
                variant="success"
                onClick={capturePhoto}
                type="button"
                disabled={maxImages ? images.length >= maxImages : false}
              >
                <i className="fas fa-camera" />
                Capture{maxImages ? ` (${images.length}/${maxImages})` : ''}
              </Button>
            </div>
          }
        >
          {error ? (
            <div className="text-center py-8">
              <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4" />
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
           <div className="flex justify-center">
             <div className="aspect-square w-[70vw] max-w-72 rounded-full overflow-hidden bg-black border-2 border-fras-gold">
               <video
                 ref={videoRef}
                 autoPlay
                 playsInline
                 className="w-full h-full object-cover"
               />
             </div>
           </div>
          )}
        </Modal>
      </>
    )
  }
)

Camera.displayName = 'Camera'