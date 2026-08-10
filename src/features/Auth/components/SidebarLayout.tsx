import { HomeIcon, SettingsIcon, UserIcon } from "lucide-react"
import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { Header } from "../../../components/Header"

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Profile", href: "/profile", icon: UserIcon },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
]

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return (
    <span
      aria-hidden="true"
      className="
        pointer-events-none absolute left-full top-1/2 z-50
        ml-2 -translate-y-1/2 whitespace-nowrap rounded-md
        bg-gray-800 px-2 py-1 text-sm text-white
        invisible opacity-0 transition-opacity duration-150
        group-hover:visible group-hover:opacity-100
        group-focus-visible:visible group-focus-visible:opacity-100
      "
    >
      {children}
    </span>
  )
}

export const SidebarLayout = () => {
  const [isClosed, setIsClosed] = useState(true)
  return (
    <div>
      <Header isClosed={isClosed} setIsClosed={setIsClosed} />

      <div className="flex h-dvh ">
        <aside
          className={`
          shrink-0 border-r border-border bg-muted-background text-foreground
          transition-[width] duration-300 ease-in-out
          ${isClosed ? "w-12" : "w-64"}
        `}
        >
          <nav className="mt-4">
            <ul
              className={`flex flex-col ${
                isClosed ? "items-center" : "items-start"
              }`}
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    `
                      group relative flex w-full items-center gap-2 rounded-md p-2 mt-2
                      ${isClosed ? "justify-center" : "justify-start"}
                      ${
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-foreground hover:bg-secondary/20 hover:text-secondary-foreground"
                      }
                    `
                  }
                  aria-label={isClosed ? item.name : undefined}
                  end
                >
                  <item.icon className="w-5 h-5" />
                  {!isClosed && (
                    <span className="whitespace-nowrap">{item.name}</span>
                  )}
                  {isClosed && <Tooltip>{item.name}</Tooltip>}
                </NavLink>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
