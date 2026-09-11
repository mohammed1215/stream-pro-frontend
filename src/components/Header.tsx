import { Bell, Menu, Plus, Search, Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "../features/Auth/hooks/useAuth"
import { InputGroup, InputGroupButton, InputGroupInput } from "./ui/input-group"
import { Button } from "./ui/button"
import { router } from "../router"
import { useState } from "react"
import { NotificationDropDown } from "./NotificationDroDown"
import { useTheme } from "../hooks/useTheme"

interface SearchFormProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: React.FormEvent) => void
}

export const SearchForm = ({ value, onChange, onSubmit }: SearchFormProps) => {
  return (
    <form role="search" onSubmit={onSubmit} className="w-full max-w-lg mx-auto">
      <label htmlFor="site-search" className="sr-only">
        Search videos
      </label>

      <InputGroup className="overflow-hidden rounded-full h-10 border border-border/80 bg-muted/40 focus-within:border-primary/60 transition-colors">
        <InputGroupInput
          id="site-search"
          name="q"
          type="search"
          placeholder="Search..."
          value={value}
          onChange={onChange}
          autoComplete="off"
          className="px-4 text-sm bg-transparent"
        />

        <InputGroupButton
          type="submit"
          className="h-full rounded-s-none px-4 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
          disabled={!value.trim()}
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="sr-only">Submit search</span>
        </InputGroupButton>
      </InputGroup>
    </form>
  )
}

export const Header = ({
  isClosed,
  setIsClosed,
}: {
  isClosed: boolean
  setIsClosed: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const user = useAuth((state) => state.user)
  const [searchTerm, setSearchTerm] = useState("")
  const [openNotifications, setOpenNotifications] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const query = searchTerm.trim()
    if (!query) return
    router.navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <header className="text-foreground bg-background/95 backdrop-blur-md px-6 py-3 flex justify-between items-center border-b border-border/60 sticky top-0 z-50">
      {/* 1️⃣ Left: Sidebar toggle & Logo */}
      <div
        className={`flex gap-3 ${
          isClosed ? "justify-center" : "justify-start"
        } items-center`}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsClosed((prev) => !prev)}
            aria-label={isClosed ? "Open sidebar" : "Close sidebar"}
            aria-expanded={!isClosed}
            aria-controls="sidebar"
            className="rounded-full hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </motion.div>

        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => router.navigate("/")}
        >
          <img src="/logo_icon.svg" alt="Stream Pro" className="w-7 h-7" />
          <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-tight leading-none">
              Stream Pro
            </h1>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Premium
            </span>
          </div>
        </div>
      </div>

      {/* 2️⃣ Center: Search Bar */}
      <SearchForm
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onSubmit={handleSubmit}
      />

      {/* 3️⃣ Right: Actions & Profile */}
      <section className="flex items-center gap-2 sm:gap-3">
        {/* Create Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="flex items-center gap-1.5 px-4 h-9 rounded-full font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create</span>
          </Button>
        </motion.div>

        {/* Notifications */}
        <div className="relative">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setOpenNotifications(!openNotifications)}
              className="rounded-full relative hover:bg-muted text-foreground/80 hover:text-foreground"
            >
              <Bell className="w-5 h-5" />
              {/* Optional unread dot */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
            </Button>
          </motion.div>
          {openNotifications && <NotificationDropDown />}
        </div>

        {/* Theme Toggle Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-full text-foreground/80 hover:text-foreground hover:bg-muted"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </motion.div>

        {/* User Profile Avatar */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.navigate("/profile")}
          className="cursor-pointer rounded-full ring-2 ring-border hover:ring-primary/60 transition-all ml-1"
          aria-label="Go to profile"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name ? `${user.name} profile avatar` : "Profile avatar"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex justify-center items-center font-semibold text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </motion.button>
      </section>
    </header>
  )
}
