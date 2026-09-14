import {
  Home,
  ListVideo,
  History,
  Clock,
  ThumbsUp,
  Settings,
  User,
  LayoutDashboard,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { NavLink, useLocation, useOutlet } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "../../../components/Header"
import { PlaylistIcon } from "@vidstack/react/icons"
import { CreatePlaylistModal } from "../../../components/CreatePlaylistModal"

interface NavItemData {
  name: string
  href: string
  icon: LucideIcon | React.ComponentType<{ className?: string }>
}

interface NavSection {
  title?: string
  items: NavItemData[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { name: "Home", href: "/", icon: Home },
      { name: "Subscriptions", href: "/feed/subscriptions", icon: ListVideo },
    ],
  },
  {
    title: "You",
    items: [
      { name: "History", href: "/feed/history", icon: History },
      { name: "Watch Later", href: "/feed/watchlater", icon: Clock },
      { name: "Playlists", href: "/feed/playlists", icon: PlaylistIcon },
      { name: "Liked Videos", href: "/feed/liked", icon: ThumbsUp },
      { name: "Your Profile", href: "/profile", icon: User },
    ],
  },
  {
    title: "Creator",
    items: [{ name: "Studio", href: "/studio", icon: LayoutDashboard }],
  },
  {
    items: [{ name: "Settings", href: "/settings", icon: Settings }],
  },
]

const MOBILE_BOTTOM_NAV = [
  { name: "Home", href: "/", icon: Home },
  { name: "Subscriptions", href: "/feed/subscriptions", icon: ListVideo },
  { name: "Studio", href: "/studio", icon: LayoutDashboard },
]

const NavItem = ({
  item,
  isClosed,
  onNavigate,
}: {
  item: NavItemData
  isClosed: boolean
  onNavigate?: () => void
}) => {
  const IconComponent = item.icon

  return (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      onClick={onNavigate}
      className="group relative flex h-11 items-center rounded-xl px-3 text-sm font-medium outline-none transition-colors"
      aria-label={item.name}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeNavPill"
              className="absolute inset-0 rounded-xl bg-secondary shadow-sm"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}

          {!isActive && (
            <div className="absolute inset-0 rounded-xl bg-transparent transition-colors group-hover:bg-secondary/40" />
          )}

          <div
            className={`relative z-10 flex w-full items-center gap-3.5 ${
              isClosed ? "justify-center" : "justify-start"
            }`}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex shrink-0 items-center justify-center"
            >
              <IconComponent
                className={`h-5 w-5 transition-colors ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
            </motion.div>

            <AnimatePresence mode="wait" initial={false}>
              {!isClosed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className={`truncate ${
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {isClosed && (
            <div className="pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md ring-1 ring-border/50 transition-all duration-150 group-hover:translate-x-1 group-hover:opacity-100">
              {item.name}
            </div>
          )}
        </>
      )}
    </NavLink>
  )
}

const SidebarNav = ({
  isClosed,
  onNavigate,
}: {
  isClosed: boolean
  onNavigate?: () => void
}) => (
  <div className="space-y-6">
    {NAV_SECTIONS.map((section, idx) => (
      <div key={idx} className="space-y-1">
        <AnimatePresence initial={false}>
          {!isClosed && section.title && (
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
            >
              {section.title}
            </motion.h3>
          )}
        </AnimatePresence>

        <ul className="space-y-1">
          {section.items.map((item) => (
            <li key={item.href}>
              <NavItem
                item={item}
                isClosed={isClosed}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>

        {idx < NAV_SECTIONS.length - 1 && (
          <hr className="my-4 border-border/60" />
        )}
      </div>
    ))}
  </div>
)

export const SidebarLayout = () => {
  const [isClosed, setIsClosed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  const currentOutlet = useOutlet()

  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileOpen])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Header
        isClosed={isClosed}
        isOpen={isMobileOpen}
        onMenuClick={() => setIsClosed(!isClosed)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isClosed ? 76 : 240 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative hidden shrink-0 border-r border-border bg-card md:block"
        >
          <div className="flex h-full flex-col overflow-x-hidden overflow-y-auto px-3 py-4 scrollbar-thin">
            <SidebarNav isClosed={isClosed} />
          </div>
        </motion.aside>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md md:hidden"
                aria-hidden="true"
              />
              <motion.aside
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-2xl border-t border-border bg-card shadow-2xl md:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                  <span className="text-sm font-semibold">Menu</span>
                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close menu"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
                <div className="flex max-h-[calc(85vh-57px)] flex-col overflow-y-auto px-3 py-4 scrollbar-thin">
                  <SidebarNav
                    isClosed={false}
                    onNavigate={() => setIsMobileOpen(false)}
                  />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Viewport */}
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 pb-20 md:p-6 md:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{
                duration: 0.22,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="w-full"
            >
              {currentOutlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 📱 Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card/98 px-2 backdrop-blur-xl md:hidden">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs outline-none"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavActive"
                      className="absolute inset-x-2 inset-y-0.5 rounded-xl bg-secondary"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                      }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-5 w-5 transition-colors ${
                      isActive
                        ? "text-primary font-bold"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`relative z-10 truncate font-medium ${
                      isActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-xs text-muted-foreground outline-none"
        >
          <Menu className="h-5 w-5" />
          <span className="font-medium">More</span>
        </button>
      </nav>

      <CreatePlaylistModal />
    </div>
  )
}
