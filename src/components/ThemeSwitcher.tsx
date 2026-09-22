// components/ThemeSwitcher.tsx
import { useState } from "react"
import { Sun, Moon, Waves, Sunset, type LucideIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as Popover from "@radix-ui/react-popover"
import { useTheme, THEMES, type Theme } from "../hooks/useTheme"

interface ThemeOption {
  value: Theme
  label: string
  icon: LucideIcon
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "ocean", label: "Ocean", icon: Waves },
  { value: "sunset", label: "Sunset", icon: Sunset },
]

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const activeOption =
    THEME_OPTIONS.find((opt) => opt.value === theme) ?? THEME_OPTIONS[0]
  const ActiveIcon = activeOption.icon

  const handleSelect = (value: Theme) => {
    setTheme(value)
    setIsOpen(false)
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Change theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground"
        >
          <motion.div
            key={theme}
            initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ActiveIcon className="h-4.5 w-4.5" />
          </motion.div>
        </button>
      </Popover.Trigger>

      <AnimatePresence>
        {isOpen && (
          <Popover.Portal forceMount>
            <Popover.Content forceMount align="end" sideOffset={8} asChild>
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
                className="z-50 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-lg ring-1 ring-border/50"
              >
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const isActive = option.value === theme

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      onClick={() => handleSelect(option.value)}
                      className="group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors hover:bg-secondary"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="themeOptionActive"
                          className="absolute inset-0 rounded-lg bg-secondary"
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 30,
                          }}
                        />
                      )}
                      <Icon
                        className={`relative z-10 h-4 w-4 ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                      <span
                        className={`relative z-10 ${
                          isActive
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  )
                })}
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  )
}
