import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { fadeUpItem } from "./studioMotion"

export const StudioContentCard = ({
  title,
  number,
  spanWord,
  Icon,
  description,
  trend,
}: {
  title: string
  number: number | string
  spanWord?: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
  trend?: { value: string; isPositive: boolean }
}) => {
  return (
    <motion.div
      variants={fadeUpItem}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          {typeof number === "number" ? number.toLocaleString() : number}
        </h3>
        {spanWord && (
          <span className="text-xs font-medium text-muted-foreground">
            {spanWord}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <p className="text-xs text-muted-foreground truncate">{description}</p>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
              trend.isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            )}
          >
            <ArrowUpRight
              className={cn("h-3 w-3", !trend.isPositive && "rotate-90")}
            />
            {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  )
}
