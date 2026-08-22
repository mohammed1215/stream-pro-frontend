import { useState, useRef } from "react"
import {
  X,
  UploadCloud,
  Film,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

// 1. Reusable Drag & Drop Zone
interface FileDropZoneProps {
  label: string
  file: File | null
  onFileSelect: (file: File) => void
  onClear: () => void
  accept: string
  error?: string
  previewUrl?: string | null
}

const FileDropZone = ({
  label,
  file,
  onFileSelect,
  onClear,
  accept,
  error,
  previewUrl,
}: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${
          isDragging
            ? "border-indigo-500 bg-indigo-50/50"
            : error
            ? "border-red-300 bg-red-50/30"
            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
        }`}
      >
        <input
          type="file"
          className="hidden"
          ref={inputRef}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelect(file)
          }}
          accept={accept}
        />

        {/* If Image Preview exists */}
        {previewUrl ? (
          <div className="relative w-full h-32 group">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded">
                Click to change
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={`p-3 rounded-full ${
                error ? "bg-red-100" : "bg-indigo-50"
              }`}
            >
              {accept.includes("video") ? (
                <Film
                  className={`w-6 h-6 ${
                    error ? "text-red-500" : "text-indigo-600"
                  }`}
                />
              ) : (
                <ImageIcon
                  className={`w-6 h-6 ${
                    error ? "text-red-500" : "text-indigo-600"
                  }`}
                />
              )}
            </div>

            {file ? (
              <div className="mt-1">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {accept.includes("video")
                    ? "MP4, WebM or MOV"
                    : "PNG, JPG or WEBP"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Clear Button */}
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}

// 2. Main Create Video Form
interface CreateVideoFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export const CreateVideoForm = ({
  onSuccess,
  onCancel,
}: CreateVideoFormProps) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle Thumbnail Selection
  const handleThumbnailSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "Please upload an image file",
      }))
      return
    }
    setThumbnailFile(file)
    setErrors((prev) => ({ ...prev, thumbnail: "" }))
    setThumbnailPreview(URL.createObjectURL(file))
  }

  // Handle Video Selection
  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setErrors((prev) => ({ ...prev, video: "Please upload a video file" }))
      return
    }
    setVideoFile(file)
    setErrors((prev) => ({ ...prev, video: "" }))
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!description.trim()) newErrors.description = "Description is required"
    if (!videoFile) newErrors.video = "Video file is required"
    if (!thumbnailFile) newErrors.thumbnail = "Thumbnail is required"

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsSubmitting(true)

    try {
      // Construct FormData for the API
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("video", videoFile!)
      formData.append("thumbnail", thumbnailFile!)

      // TODO: Replace with your actual API call
      // await uploadVideoToApi(formData)

      onSuccess()

      // Reset form
      setTitle("")
      setDescription("")
      setVideoFile(null)
      setThumbnailFile(null)
      setThumbnailPreview(null)
    } catch (error) {
      console.error("Upload failed:", error)
      setErrors({ submit: "Failed to upload video. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Upload new video</h2>
          <p className="text-sm text-gray-500">
            Fill in the details below to publish your content.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a catchy title..."
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition ${
            errors.title
              ? "border-red-300 focus:ring-2 focus:ring-red-500"
              : "border-gray-200 focus:ring-2 focus:ring-indigo-500"
          }`}
        />
        {errors.title && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Tell viewers about your video..."
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition resize-none ${
            errors.description
              ? "border-red-300 focus:ring-2 focus:ring-red-500"
              : "border-gray-200 focus:ring-2 focus:ring-indigo-500"
          }`}
        />
        {errors.description && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.description}
          </p>
        )}
      </div>

      {/* File Uploads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileDropZone
          label="Video File"
          file={videoFile}
          onFileSelect={handleVideoSelect}
          onClear={() => setVideoFile(null)}
          accept="video/*"
          error={errors.video}
        />

        <FileDropZone
          label="Thumbnail"
          file={thumbnailFile}
          onFileSelect={handleThumbnailSelect}
          onClear={() => {
            setThumbnailFile(null)
            setThumbnailPreview(null)
          }}
          accept="image/*"
          error={errors.thumbnail}
          previewUrl={thumbnailPreview}
        />
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
          <AlertCircle className="w-4 h-4" /> {errors.submit}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" /> Publish Video
            </>
          )}
        </button>
      </div>
    </form>
  )
}
