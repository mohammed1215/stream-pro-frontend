import {
  LayoutDashboard,
  Video,
  BarChart3,
  MessageSquare,
  HardDrive,
  Plus,
  Bell,
  ChevronRight,
  Play,
  Menu,
  X,
  Sparkles,
  type LucideIcon,
  SlidersHorizontal,
} from "lucide-react"
import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useAuth } from "../features/Auth/hooks/useAuth"
import { useCreateVideoModal } from "../hooks/useCreateVideo"
import { CreateVideoModal } from "./CreateVideoModal"
import { CreatePlaylistModal } from "./CreatePlaylistModal"
import { ThemeSwitcher } from "./ThemeSwitcher"

interface StudioNavItemConfig {
  name: string
  href: string
  icon: LucideIcon
  end?: boolean
  group: "Overview" | "Manage" | "Insights"
}

const STUDIO_NAV_ITEMS: StudioNavItemConfig[] = [
  {
    name: "Dashboard",
    href: "/studio",
    icon: LayoutDashboard,
    end: true,
    group: "Overview",
  },
  { name: "Content", href: "/studio/content", icon: Video, group: "Manage" },
  {
    name: "Customize",
    href: "/studio/channel/customization",
    icon: SlidersHorizontal,
    group: "Manage",
  },
  {
    name: "Comments",
    href: "/studio/comments",
    icon: MessageSquare,
    group: "Manage",
  },
  {
    name: "Analytics",
    href: "/studio/analytics",
    icon: BarChart3,
    group: "Insights",
  },
]

const StudioNavItem = ({
  item,
  onNavigate,
}: {
  item: StudioNavItemConfig
  onNavigate?: () => void
}) => (
  <NavLink
    to={item.href}
    end={item.end}
    onClick={onNavigate}
    className={({ isActive }) =>
      `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-accent-bg text-accent-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="studio-active-pill"
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
            className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-primary shadow-[0_0_12px_var(--accent-border)]"
          />
        )}
        <item.icon
          className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
            isActive
              ? "text-primary"
              : "text-muted-foreground/70 group-hover:text-foreground"
          }`}
        />
        <span className="truncate">{item.name}</span>
      </>
    )}
  </NavLink>
)

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const groups = ["Overview", "Manage", "Insights"] as const

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Navigation Groups */}
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {groups.map((group) => {
          const items = STUDIO_NAV_ITEMS.filter((i) => i.group === group)
          if (!items.length) return null

          return (
            <div key={group} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {group}
              </h3>
              <nav className="flex flex-col gap-0.5 pt-1">
                {items.map((item) => (
                  <StudioNavItem
                    key={item.href}
                    item={item}
                    onNavigate={onNavigate}
                  />
                ))}
              </nav>
            </div>
          )
        })}
      </div>

      {/* Storage Footer Widget */}
      <div className="shrink-0 border-t border-border/80 p-4">
        <div className="rounded-2xl border border-border bg-secondary/60 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-primary" />
              Storage
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              75%
            </span>
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/4 rounded-full bg-linear-to-r from-primary to-accent" />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>75 GB used</span>
            <span>100 GB</span>
          </div>

          <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-border bg-card py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-secondary">
            <Sparkles className="h-3 w-3 text-accent" />
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  )
}

export const StudioLayout = () => {
  const user = useAuth((state) => state.user)
  const { open: openVideoModal } = useCreateVideoModal()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  const [lastPathname, setLastPathname] = useState(location.pathname)
  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMobileNavOpen(false)
  }

  useEffect(() => {
    if (!mobileNavOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen])

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent-bg selection:text-accent-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-md sm:px-6">
        {/* Left: Mobile Toggle & Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
          >
            <Menu className="h-4 w-4" />
          </button>

          <NavLink to="/studio" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Play className="h-4 w-4 fill-current" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-foreground">
                Stream Pro
              </span>
              <span className="rounded-md border border-accent-border bg-accent-bg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                Studio
              </span>
            </div>
          </NavLink>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <motion.button
            onClick={openVideoModal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Create</span>
          </motion.button>

          <button className="relative rounded-xl border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-background" />
          </button>
          <ThemeSwitcher />

          <NavLink
            to="/"
            className="hidden items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground md:flex"
          >
            <span>Back to App</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </NavLink>

          <div className="mx-1 hidden h-5 w-px bg-border md:block" />

          {/* User Profile Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-tr from-primary to-accent text-xs font-bold text-primary-foreground shadow-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "SP"}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Fixed Desktop Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border/80 bg-background/70 backdrop-blur-md lg:block">
          <SidebarContent />
        </aside>

        {/* Mobile Animated Drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                key="backdrop"
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                onClick={() => setMobileNavOpen(false)}
              />
              <motion.aside
                key="drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Studio navigation"
                className="fixed bottom-0 left-0 top-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-border bg-background shadow-2xl lg:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 40 }
                }
              >
                <div className="flex h-16 items-center justify-between border-b border-border/80 px-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Menu
                  </span>
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Close navigation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content Outlet Canvas */}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <CreatePlaylistModal />
      <CreateVideoModal />
    </div>
  )
}
