import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  confirmUploadVideoApi,
  createVideoApi,
  deleteVideo as deleteVideoApi,
  updateVideoThumbnailApi,
} from "../lib/video"

export const useVideo = () => {
  const queryClient = useQueryClient()
  const { mutate: deleteVideo } = useMutation({
    mutationFn: deleteVideoApi,
    onSuccess: () => {
      console.log("Video deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["videos"] })
    },
  })

  const { mutateAsync: createVideo } = useMutation({
    mutationFn: createVideoApi,
    onSuccess: () => {
      console.log("Video created successfully")
      queryClient.invalidateQueries({ queryKey: ["videos"] })
    },
  })

  const { mutate: updateVideoThumbnail } = useMutation({
    mutationFn: async ({
      videoId,
      thumbnailFile,
    }: {
      videoId: string
      thumbnailFile: File
    }) => updateVideoThumbnailApi(videoId, thumbnailFile),
  })

  const { mutateAsync: confirmUploadVideo } = useMutation({
    mutationFn: confirmUploadVideoApi,
  })

  return {
    deleteVideo,
    createVideo,
    updateVideoThumbnail,
    confirmUploadVideo,
  }
}
