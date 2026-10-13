import { ApertureLoader } from "./AperturLoader"

export const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <ApertureLoader />
  </div>
)
