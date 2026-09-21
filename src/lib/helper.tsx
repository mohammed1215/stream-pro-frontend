import { Check, X } from "lucide-react"
import { toast, type ToastPosition } from "react-toastify"

const baseStyle: React.CSSProperties = {
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: 500,
  padding: "12px 16px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
}

export const toastCustom = () => {
  function success(content: string, position: ToastPosition = "bottom-center") {
    toast(content, {
      icon: <Check className="h-4 w-4 text-emerald-600 shrink-0" />,
      style: {
        ...baseStyle,
        backgroundColor: "#ECFDF5",
        border: "1px solid #A7F3D0",
        color: "#065F46",
      },
      position,
      hideProgressBar: true,
    })
  }

  function error(content: string, position: ToastPosition = "bottom-center") {
    toast(content, {
      icon: <X className="h-4 w-4 text-red-600 shrink-0" />,
      style: {
        ...baseStyle,
        backgroundColor: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "#991B1B",
      },
      position,
      hideProgressBar: true,
    })
  }

  return { success, error }
}
