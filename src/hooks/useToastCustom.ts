import { toast, type ToastPosition } from "react-toastify"

export const useToastCustom = () => {
  function success(content: string, position: ToastPosition = "bottom-center") {
    toast(content, {
      type: "success",
      style: {
        border: "1px solid green",
        backgroundColor: "green",
        color: "text-white",
      },
      position,
    })
  }

  function error(content: string, position: ToastPosition = "bottom-center") {
    toast(content, {
      type: "error",
      style: {
        border: "1px solid red",
        backgroundColor: "red",
        color: "text-white",
      },
      position,
    })
  }

  return { success, error }
}
