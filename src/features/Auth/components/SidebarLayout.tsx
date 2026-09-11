import {
  Home,
  ListVideo,
  History,
  Clock,
  ThumbsUp,
  Settings,
  User,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react"
import React, { useState } from "react"
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

const NavItem = ({
  item,
  isClosed,
}: {
  item: NavItemData
  isClosed: boolean
}) => {
  const IconComponent = item.icon

  return (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      className="group relative flex h-11 items-center rounded-xl px-3 text-sm font-medium outline-none transition-colors"
      aria-label={item.name}
    >
      {({ isActive }) => (
        <>
          {/* Active Background Pill */}
          {isActive && (
            <motion.div
              layoutId="activeNavPill"
              className="absolute inset-0 rounded-xl bg-secondary shadow-sm"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}

          {/* Hover highlight for inactive links */}
          {!isActive && (
            <div className="absolute inset-0 rounded-xl bg-transparent transition-colors group-hover:bg-secondary/40" />
          )}

          {/* Icon & Label Container */}
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

            {/* Label Animation */}
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

          {/* Hover Tooltip (Collapsed State Only) */}
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

export const SidebarLayout = () => {
  const [isClosed, setIsClosed] = useState(false)
  const location = useLocation()
  const currentOutlet = useOutlet()
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Header isClosed={isClosed} setIsClosed={setIsClosed} />

      <div className="flex flex-1 overflow-hidden">
        {/* Animated Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isClosed ? 76 : 240 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative shrink-0 border-r border-border bg-card"
        >
          <div className="flex h-full flex-col overflow-x-hidden overflow-y-auto px-3 py-4 scrollbar-thin">
            <div className="space-y-6">
              {NAV_SECTIONS.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  {/* Section Title */}
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

                  {/* Section Items */}
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <NavItem item={item} isClosed={isClosed} />
                      </li>
                    ))}
                  </ul>

                  {/* Section Divider */}
                  {idx < NAV_SECTIONS.length - 1 && (
                    <hr className="my-4 border-border/60" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* Main Content Viewport */}
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
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
      <CreatePlaylistModal />
    </div>
  )
}
