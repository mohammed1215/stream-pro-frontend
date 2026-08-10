import { Bell, Menu, Plus, Search } from "lucide-react"
import { useAuth } from "../features/Auth/hooks/useAuth"
import { InputGroup, InputGroupButton, InputGroupInput } from "./ui/input-group"
import { Button } from "./ui/button"
import { router } from "../router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchNotifications } from "../lib/notifications"
import { NotificationDropDown } from "./NotificationDroDown"

interface SearchFormProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: React.SubmitEvent) => void
}

export const SearchForm = ({ value, onChange, onSubmit }: SearchFormProps) => {
  return (
    <form role="search" onSubmit={onSubmit} className="w-full max-w-lg mx-auto">
      <label htmlFor="site-search" className="sr-only">
        Search videos
      </label>

      <InputGroup className="overflow-hidden rounded-md h-10">
        <InputGroupInput
          id="site-search"
          name="q"
          type="search"
          placeholder="Search..."
          value={value}
          onChange={onChange}
          autoComplete="off"
        />

        <InputGroupButton
          type="submit"
          className="h-full rounded-s-none"
          disabled={!value.trim()}
        >
          <Search className="w-5! h-5! text-accent-foreground" />
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
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")

  const [openNotifications, setOpenNotifications] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 5

  const { data: notifications, isPending } = useQuery({
    queryKey: ["notifications", user?.id, pageNumber],
    queryFn: () => fetchNotifications(pageNumber, pageSize),
  })

  const handleSubmit = (event: React.SubmitEvent) => {
    event.preventDefault()

    const query = searchTerm.trim()

    if (!query) return

    router.navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <header className="text-foreground bg-background p-4 flex justify-between items-center border-b border-border sticky top-0 z-60">
      <div
        className={`flex gap-2 ${
          isClosed ? "justify-center" : "justify-start"
        } items-center`}
      >
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsClosed((prev) => !prev)}
            aria-label={isClosed ? "Open sidebar" : "Close sidebar"}
            aria-expanded={!isClosed}
            aria-controls="sidebar"
          >
            <Menu />
          </Button>
        </div>
        <img src="/logo_icon.svg" alt="" />
        <div className="flex flex-col items-start justify-center">
          <h1 className="text-xl font-bold">Stream Pro</h1>
          <p>Premium Content</p>
        </div>
      </div>

      <SearchForm
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onSubmit={handleSubmit}
      />

      <section className="flex items-center gap-4">
        <Button className="flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-100">
          <Plus />
          Create
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            onClick={() => setOpenNotifications(!openNotifications)}
          >
            <Bell />
          </Button>
          {openNotifications && (
            <NotificationDropDown
              notifications={notifications?.items}
              isPending={isPending}
              currentPage={pageNumber}
              hasNextPage={true}
              onPageChange={setPageNumber}
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => router.navigate("/profile")}
          className="cursor-pointer rounded-full"
          aria-label="Go to profile"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name ? `${user.name} profile avatar` : "Profile avatar"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-secondary text-white rounded-full justify-center items-center flex font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </button>
      </section>
    </header>
  )
}
