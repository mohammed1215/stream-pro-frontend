import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import {
  confirmUploadThumbnailApi,
  confirmUploadVideoApi,
  initiateVideoUploadApi,
  uploadThumbnailToCloudApi,
  uploadVideoToCloudApi,
} from "../lib/video"

export type UploadStep =
  | "idle"
  | "initiating"
  | "uploading-video"
  | "uploading-thumbnail"
  | "finalizing"

export const useVideoUpload = () => {
  const queryClient = useQueryClient()
  const [videoProgress, setVideoProgress] = useState(0)
  const [thumbnailProgress, setThumbnailProgress] = useState(0)
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle")
  const abortControllerRef = useRef<AbortController | null>(null)

  const resetProgress = () => {
    setVideoProgress(0)
    setThumbnailProgress(0)
    setUploadStep("idle")
  }

  const mutation = useMutation({
    mutationFn: async ({
      thumbnailFile,
      videoFile,
      title,
      tags,
      categoryId,
      description,
    }: {
      title: string
      description: string
      tags: string[]
      categoryId: string
      videoFile: File
      thumbnailFile: File | null
    }) => {
      resetProgress()
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      // Request upload signatures
      setUploadStep("initiating")
      const res = await initiateVideoUploadApi({
        title,
        description,
        tags,
        categoryId,
      })
      const { videoId, signatureVideoData, signatureThumbnailData } = res.data

      // Upload Video File
      setUploadStep("uploading-video")
      const cloudVideoFormData = new FormData()
      cloudVideoFormData.append("file", videoFile)
      cloudVideoFormData.append("api_key", signatureVideoData.apiKey)
      cloudVideoFormData.append(
        "timestamp",
        String(signatureVideoData.timestamp)
      )
      cloudVideoFormData.append("signature", signatureVideoData.signature)
      cloudVideoFormData.append("public_id", signatureVideoData.public_id)
      cloudVideoFormData.append("folder", signatureVideoData.folder)

      if (signatureVideoData.eager) {
        cloudVideoFormData.append("eager", signatureVideoData.eager)
      }
      if (signatureVideoData.eager_async) {
        cloudVideoFormData.append(
          "eager_async",
          String(signatureVideoData.eager_async)
        )
      }
      if (signatureVideoData.eager_notification_url) {
        cloudVideoFormData.append(
          "eager_notification_url",
          signatureVideoData.eager_notification_url
        )
      }

      const cloudRes = await uploadVideoToCloudApi({
        uploadUrl: signatureVideoData.uploadUrl,
        formData: cloudVideoFormData,
        signal,
        onProgress: (percent) => setVideoProgress(percent),
      })
      setVideoProgress(100)

      // Upload Thumbnail File (if selected)
      let cloudThumbRes: any = null
      if (thumbnailFile && signatureThumbnailData) {
        setUploadStep("uploading-thumbnail")
        const cloudThumbnailFormData = new FormData()
        cloudThumbnailFormData.append("file", thumbnailFile)
        cloudThumbnailFormData.append("api_key", signatureThumbnailData.apiKey)
        cloudThumbnailFormData.append(
          "timestamp",
          String(signatureThumbnailData.timestamp)
        )
        cloudThumbnailFormData.append(
          "signature",
          signatureThumbnailData.signature
        )
        cloudThumbnailFormData.append(
          "public_id",
          signatureThumbnailData.public_id
        )
        cloudThumbnailFormData.append("folder", signatureThumbnailData.folder)
        cloudThumbnailFormData.append(
          "transformation",
          signatureThumbnailData.transformation
        )

        cloudThumbRes = await uploadThumbnailToCloudApi({
          uploadUrl: signatureThumbnailData.uploadUrl,
          formData: cloudThumbnailFormData,
          signal,
          onProgress: (percent) => setThumbnailProgress(percent),
        })
        setThumbnailProgress(100)
      }

      // Step 4: Finalize on your server
      setUploadStep("finalizing")
      const confirmationRequests: Promise<any>[] = [
        confirmUploadVideoApi(videoId, {
          publicId: cloudRes.public_id,
          version: cloudRes.version,
          signature: cloudRes.signature,
          duration: cloudRes.duration,
          bytes: cloudRes.bytes,
        }),
      ]

      if (cloudThumbRes) {
        confirmationRequests.push(
          confirmUploadThumbnailApi(videoId, {
            publicId: cloudThumbRes.public_id,
            version: cloudThumbRes.version,
            signature: cloudThumbRes.signature,
            thumbnailUrl: cloudThumbRes.secure_url,
          })
        )
      }

      await Promise.all(confirmationRequests)
      setUploadStep("idle")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] })
      queryClient.invalidateQueries({ queryKey: ["owner-videos"] })
      queryClient.invalidateQueries({ queryKey: ["owner-channel-stats"] })
    },
    onSettled: () => {
      abortControllerRef.current = null
    },
  })

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    mutation.reset()
    resetProgress()
  }

  return {
    uploadVideo: mutation.mutateAsync,
    isUploading: mutation.isPending,
    error: mutation.error,
    videoProgress,
    thumbnailProgress,
    uploadStep,
    cancelUpload,
    reset: () => {
      mutation.reset()
      resetProgress()
    },
  }
}
