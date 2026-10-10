import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  postCommentOnVideo,
  updateComment as updateCommentApi,
  deleteComment as deleteCommentApi,
} from "../lib/comment"

export const useCommentApi = () => {
  const queryClient = useQueryClient()
  const {
    mutate: postComment,
    isPending: isPostingComment,
    error: postCommentError,
  } = useMutation({
    mutationFn: postCommentOnVideo,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      // Refresh the replies list of the parent comment (if this was a reply).
      // Invalidating the ["replies"] prefix refetches every open replies query,
      // including ["replies", parentId, ...] infinite queries.
      if (variables?.parentId) {
        queryClient.invalidateQueries({ queryKey: ["replies", variables.parentId] })
      }
      queryClient.invalidateQueries({ queryKey: ["replies"] })
    },
  })
  const { mutate: updateComment } = useMutation({
    mutationFn: updateCommentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
    },
  })
  const { mutate: deleteComment } = useMutation({
    mutationFn: deleteCommentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      queryClient.invalidateQueries({ queryKey: ["replies"] })
    },
  })

  return { postComment, isPostingComment, postCommentError, updateComment, deleteComment }
}
