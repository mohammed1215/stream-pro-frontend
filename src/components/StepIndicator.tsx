import { Check } from "lucide-react"

export type Step = 1 | 2 | 3

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Media" },
  { id: 2, label: "Details" },
  { id: 3, label: "Publish" },
]

export function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex flex-1 items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                currentStep === s.id
                  ? "bg-primary text-primary-foreground "
                  : currentStep > s.id
                  ? "bg-cyan-100 text-accent-foreground dark:bg-cyan-950/60 "
                  : "bg-secondary text-slate-400 dark:text-slate-500"
              }`}
            >
              {currentStep > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
            </div>
            <span
              className={`hidden text-[11px] font-semibold sm:inline ${
                currentStep === s.id
                  ? "text-slate-900 dark:text-primary-foreground"
                  : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px flex-1 transition-colors ${
                currentStep > s.id ? "bg-cyan-400" : "bg-slate-200 "
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
