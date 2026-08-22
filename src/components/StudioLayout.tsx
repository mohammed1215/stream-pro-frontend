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
  type LucideProps,
} from "lucide-react"
import { type ForwardRefExoticComponent, type RefAttributes } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../features/Auth/hooks/useAuth"

const STUDIO_NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/studio",
    icon: LayoutDashboard,
    end: true,
    group: "Overview",
  },
  { name: "Content", href: "/studio/content", icon: Video, group: "Manage" },
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

type StudioNavItem = {
  name: string
  href: string
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >
  end?: boolean
  group: string
}

const StudioNavItem = ({ item }: { item: StudioNavItem }) => (
  <NavLink
    to={item.href}
    end={item.end}
    className={({ isActive }) =>
      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
       ${
         isActive
           ? "bg-indigo-50 text-indigo-700"
           : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
       }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-600 shadow-sm shadow-indigo-200" />
        )}
        <item.icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
            isActive
              ? "text-indigo-600"
              : "text-gray-400 group-hover:text-gray-600"
          }`}
        />
        <span className="whitespace-nowrap">{item.name}</span>
      </>
    )}
  </NavLink>
)

export const StudioLayout = () => {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Studio topbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <Play className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-gray-900">
            Stream Pro
          </span>
          <span className="rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            Studio
          </span>
        </div>

        <div className="flex-1" />

        <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          Create
        </button>

        <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        <NavLink
          to="/"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <span>Back to App</span>
          <ChevronRight className="w-4 h-4" />
        </NavLink>

        <div className="h-6 w-px bg-gray-200 mx-1" />

        <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 transition-colors">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
            {user?.name.slice(0, 2).toUpperCase()}
          </div>
        </button>
      </header>

      <div className="flex">
        <aside className="fixed bottom-0 left-0 top-16 w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white flex flex-col">
          <div className="flex-1 p-4 space-y-6">
            {["Overview", "Manage", "Insights"].map((group) => (
              <div key={group}>
                <h3 className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {group}
                </h3>
                <nav className="flex flex-col gap-1">
                  {STUDIO_NAV_ITEMS.filter((i) => i.group === group).map(
                    (item) => (
                      <StudioNavItem key={item.href} item={item} />
                    )
                  )}
                </nav>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-br from-indigo-50 via-indigo-50/50 to-blue-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-white rounded-md shadow-sm">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  Storage
                </span>
              </div>
              <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden mb-2">
                <div className="h-full w-3/4 bg-indigo-600 rounded-full transition-all" />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-900">75 GB</span> of
                100 GB used.
              </p>
              <button className="mt-3 w-full text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-md py-1.5 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        </aside>

        <main className="ml-64 flex-1 p-8 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
