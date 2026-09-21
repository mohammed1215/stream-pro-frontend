import * as React from "react"
import * as Popover from "@radix-ui/react-popover"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import dayjs, { Dayjs } from "dayjs"

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  minDate?: Date | string
}

export const DateTimePicker = ({
  value,
  onChange,
  minDate,
}: DateTimePickerProps) => {
  const [open, setOpen] = React.useState(false)

  // dayjs instances
  const selectedDate = value ? dayjs(value) : null
  const [currentMonth, setCurrentMonth] = React.useState<Dayjs>(
    selectedDate || dayjs()
  )

  const hours = selectedDate ? selectedDate.format("HH") : "12"
  const minutes = selectedDate ? selectedDate.format("mm") : "00"

  const startOfMonth = currentMonth.startOf("month")
  const endOfMonth = currentMonth.endOf("month")
  const startDate = startOfMonth.startOf("week")
  const endDate = endOfMonth.endOf("week")

  const days: Dayjs[] = []
  let day = startDate
  while (day.isBefore(endDate) || day.isSame(endDate, "day")) {
    days.push(day)
    day = day.add(1, "day")
  }

  const updateDateTime = (
    newDate: Dayjs,
    newHours: string,
    newMinutes: string
  ) => {
    const updated = newDate
      .hour(parseInt(newHours, 10))
      .minute(parseInt(newMinutes, 10))

    onChange(updated.format("YYYY-MM-DDTHH:mm"))
  }

  const handleDateSelect = (d: Dayjs) => {
    updateDateTime(d, hours, minutes)
  }

  const handleTimeChange = (type: "hours" | "minutes", val: string) => {
    const baseDate = selectedDate || dayjs()
    if (type === "hours") updateDateTime(baseDate, val, minutes)
    if (type === "minutes") updateDateTime(baseDate, hours, val)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-border bg-slate-50/60 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-ring focus:bg-white focus:ring-2 focus:ring-ring/20  dark:bg-slate-950/60 dark:text-primary-foreground"
        >
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span
              className={
                !selectedDate ? "text-slate-400 dark:text-slate-500" : ""
              }
            >
              {selectedDate
                ? selectedDate.format("MMM DD, YYYY - hh:mm A")
                : "Select date & time..."}
            </span>
          </div>

          {selectedDate && (
            <div
              onClick={handleClear}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600  dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </div>
          )}
        </button>
      </Popover.Trigger>

      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content align="start" sideOffset={8} asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="z-50 w-80 rounded-2xl border border-border bg-white p-4 shadow-xl  dark:bg-slate-900"
              >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900 dark:text-primary-foreground">
                    {currentMonth.format("MMMM YYYY")}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentMonth(currentMonth.subtract(1, "month"))
                      }
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-secondary dark:text-slate-400 "
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentMonth(currentMonth.add(1, "month"))
                      }
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-secondary dark:text-slate-400 "
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium text-slate-400">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((d) => {
                    const isSelected =
                      selectedDate && d.isSame(selectedDate, "day")
                    const isCurrentMonth = d.isSame(currentMonth, "month")
                    const isDisabled = minDate
                      ? d.isBefore(dayjs(minDate).startOf("day"))
                      : false

                    return (
                      <button
                        key={d.format("YYYY-MM-DD")}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleDateSelect(d)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition
                          ${
                            !isCurrentMonth
                              ? "text-slate-300 dark:text-slate-700"
                              : "text-slate-700 dark:text-slate-200"
                          }
                          ${
                            isSelected
                              ? "bg-primary! text-primary-foreground! !"
                              : "hover:bg-secondary "
                          }
                          ${
                            isDisabled
                              ? "cursor-not-allowed opacity-30 hover:bg-transparent"
                              : ""
                          }
                        `}
                      >
                        {d.format("D")}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 ">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Time</span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-xs">
                    <select
                      value={hours}
                      onChange={(e) =>
                        handleTimeChange("hours", e.target.value)
                      }
                      className="rounded-lg border border-border bg-slate-50 px-2 py-1 text-slate-800 outline-none focus:border-ring  dark:bg-slate-950 dark:text-slate-200"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const val = i.toString().padStart(2, "0")
                        return (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        )
                      })}
                    </select>
                    <span className="text-slate-400">:</span>
                    <select
                      value={minutes}
                      onChange={(e) =>
                        handleTimeChange("minutes", e.target.value)
                      }
                      className="rounded-lg border border-border bg-slate-50 px-2 py-1 text-slate-800 outline-none focus:border-ring  dark:bg-slate-950 dark:text-slate-200"
                    >
                      {Array.from({ length: 60 }).map((_, i) => {
                        const val = i.toString().padStart(2, "0")
                        return (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  )
}
