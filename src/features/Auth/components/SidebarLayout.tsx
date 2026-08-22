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
import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { Header } from "../../../components/Header"
import { PlaylistIcon } from "@vidstack/react/icons"

// Grouped navigation for the EXPANDED sidebar
const NAV_SECTIONS = [
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

// Simplified navigation for the COLLAPSED sidebar
const COLLAPSED_ITEMS = [
  { name: "Home", href: "/", icon: Home },
  { name: "Subscriptions", href: "/feed/subscriptions", icon: ListVideo },
  { name: "Studio", href: "/studio", icon: LayoutDashboard },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
]

const NavItem = ({
  item,
  isClosed,
}: {
  item: { name: string; href: string; icon: LucideIcon }
  isClosed: boolean
}) => {
  return (
    <NavLink
      to={item.href}
      end={item.href === "/"} // Prevents "/" from being active on all pages
      className={({ isActive }) =>
        `group relative flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
        ${isClosed ? "justify-center" : "justify-start"}
        ${
          isActive
            ? "bg-secondary text-secondary-foreground font-semibold shadow-sm"
            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        }`
      }
      aria-label={item.name}
    >
      <item.icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />

      {!isClosed && <span className="truncate">{item.name}</span>}

      {/* Tooltip for closed state */}
      {isClosed && (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
          {item.name}
        </span>
      )}
    </NavLink>
  )
}

export const SidebarLayout = () => {
  const [isClosed, setIsClosed] = useState(true)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Header isClosed={isClosed} setIsClosed={setIsClosed} />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`
            shrink-0 border-r border-border bg-muted-background transition-all duration-300 ease-in-out
            ${isClosed ? "w-20" : "w-64"}
          `}
        >
          <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
            {isClosed ? (
              // COLLAPSED STATE
              <ul className="flex flex-col items-center space-y-2">
                {COLLAPSED_ITEMS.map((item) => (
                  <li key={item.href} className="w-full">
                    <NavItem item={item} isClosed={true} />
                  </li>
                ))}
              </ul>
            ) : (
              // EXPANDED STATE
              <div className="space-y-6">
                {NAV_SECTIONS.map((section, idx) => (
                  <div key={idx}>
                    {section.title && (
                      <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </h3>
                    )}
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.href}>
                          <NavItem item={item} isClosed={false} />
                        </li>
                      ))}
                    </ul>
                    {idx < NAV_SECTIONS.length - 1 && (
                      <hr className="mt-6 border-border" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
