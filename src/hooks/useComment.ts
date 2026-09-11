import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  postCommentOnVideo,
  updateComment as updateCommentApi,
  deleteComment as deleteCommentApi,
} from "../lib/comment"

export const useCommentApi = () => {
  const queryClient = useQueryClient()
  const { mutate: postComment } = useMutation({
    mutationFn: postCommentOnVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
    },
  })
  const { mutate: updateComment } = useMutation({
    mutationFn: updateCommentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
    },
  })
  const { mutate: deleteComment } = useMutation({
    mutationFn: deleteCommentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
    },
  })

  return { postComment, updateComment, deleteComment }
}
