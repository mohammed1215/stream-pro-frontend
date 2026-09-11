import "./ApertureLoader.css"

const BLADE_ANGLES = [0, 60, 120, 180, 240, 300]

export const ApertureLoader = ({
  label = "Loading...",
}: {
  label?: string
}) => {
  return (
    <div className="aperture-loader" role="status" aria-label={label}>
      <svg viewBox="0 0 200 200" width="120" height="120">
        {BLADE_ANGLES.map((angle, i) => (
          <g
            key={angle}
            className="aperture-blade"
            style={{
              transform: `rotate(${angle}deg)`,
              animationDelay: `${-i * 0.18}s`,
            }}
          >
            <path d="M100 100 L100 32 L138 50 Z" />
          </g>
        ))}
        <circle className="aperture-core" cx="100" cy="100" r="10" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}
