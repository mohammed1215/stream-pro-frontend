import { Bell, Menu, Plus, Search, Moon, Sun, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../features/Auth/hooks/useAuth"
import { Button } from "./ui/button"
import { router } from "../router"
import { useState } from "react"
import { NotificationDropDown } from "./NotificationDroDown"
import { useTheme } from "../hooks/useTheme"
import { useCreateVideoModal } from "../hooks/useCreateVideo"
import { usePlaylistModal } from "../hooks/usePlaylistModal"
import { Content, Portal, Root, Trigger } from "@radix-ui/react-popover"
import { SearchWithSuggestions } from "./SearchWithSuggestions"
import { ThemeSwitcher } from "./ThemeSwitcher"

const CreateModals = () => {
  const { open: openCreateVideoModal } = useCreateVideoModal()
  const { open: openCreatePlaylistModal } = usePlaylistModal()
  const [open, setOpen] = useState(false)

  return (
    <Root open={open} onOpenChange={setOpen}>
      <Trigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            size="icon"
            className="h-9 w-9 cursor-pointer rounded-full bg-primary font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:w-auto sm:gap-1.5 sm:px-4"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </motion.div>
      </Trigger>
      <AnimatePresence>
        {open && (
          <Portal forceMount>
            <Content className="z-50" align="start" sideOffset={8} asChild>
              <div className="p-3 rounded-lg dark:bg-slate-900 flex flex-col gap-2">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="icon"
                    className="h-9 w-9 cursor-pointer rounded-full bg-primary font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:w-auto sm:gap-1.5 sm:px-4"
                    onClick={() => openCreateVideoModal()}
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span className="hidden sm:inline">Create Video</span>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    size="icon"
                    className="h-9 w-9 cursor-pointer rounded-full bg-primary font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:w-auto sm:gap-1.5 sm:px-4"
                    onClick={() => openCreatePlaylistModal()}
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span className="hidden sm:inline">Create Playlist</span>
                  </Button>
                </motion.div>
              </div>
            </Content>
          </Portal>
        )}
      </AnimatePresence>
    </Root>
  )
}

export const Header = ({
  isOpen,
  isClosed,
  onMenuClick,
}: {
  isOpen: boolean
  isClosed: boolean
  onMenuClick: () => void
}) => {
  const user = useAuth((state) => state.user)
  const [searchTerm, setSearchTerm] = useState("")
  const [openNotifications, setOpenNotifications] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const query = searchTerm.trim()
    if (!query) return
    setIsMobileSearchOpen(false)
    router.navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  if (isMobileSearchOpen) {
    return (
      <header className="sticky top-0 z-50 flex items-center gap-2 border-b border-border/60 bg-background/95 px-3 py-2.5 backdrop-blur-md md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileSearchOpen(false)}
          aria-label="Close search"
          className="shrink-0 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <SearchWithSuggestions
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onSubmit={handleSubmit}
        />
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-3 py-2.5 backdrop-blur-md sm:px-6 sm:py-3">
      {/* Left: Sidebar/menu toggle & Logo */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            aria-expanded={!isClosed}
            aria-controls="sidebar"
            className="rounded-full hover:bg-muted hidden md:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </motion.div>

        <div
          className="flex cursor-pointer items-center gap-2.5"
          onClick={() => router.navigate("/")}
        >
          <img
            src="/logo_icon.svg"
            alt="Stream Pro"
            className={`h-7 w-7 ${isOpen ? "hidden" : ""}`}
          />
          <div className="hidden flex-col sm:flex">
            <h1 className="text-base font-bold leading-none tracking-tight">
              Stream Pro
            </h1>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Premium
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar - desktop/tablet only */}
      <div className="hidden flex-1 md:block">
        <SearchWithSuggestions
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Right: Actions & Profile */}
      <section className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {/* Search icon - mobile only */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="md:hidden"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSearchOpen(true)}
            aria-label="Open search"
            className="rounded-full text-foreground/80 hover:bg-muted hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Create Button */}
        <CreateModals />

        {/* Notifications */}
        <div className="relative">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setOpenNotifications(!openNotifications)}
              className="relative rounded-full text-foreground/80 hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </Button>
          </motion.div>
          {openNotifications && <NotificationDropDown />}
        </div>

        {/* Theme Toggle Button - hidden on very small screens to save space */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ThemeSwitcher />
        </motion.div>

        {/* User Profile Avatar */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.navigate("/profile")}
          className="ml-0.5 cursor-pointer rounded-full ring-2 ring-border transition-all hover:ring-primary/60 sm:ml-1"
          aria-label="Go to profile"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name ? `${user.name} profile avatar` : "Profile avatar"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </motion.button>
      </section>
    </header>
  )
}
