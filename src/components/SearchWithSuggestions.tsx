import { useState } from "react"
import { Content, Portal, Root, Trigger } from "@radix-ui/react-popover"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useDebounce } from "../hooks/useDebounce"
import { router } from "../router"
import axiosInstance from "../lib/api"
import { SearchForm } from "./SearchForm"

interface VideoSuggestion {
  id: string
  title: string
  thumbnailUrl: string
}

interface SearchWithSuggestionsProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: React.FormEvent) => void
  autoFocus?: boolean
}

interface VideoSuggestion {
  id: string
  title: string
  thumbnailUrl: string
}

interface SearchResponse {
  videos: { items: VideoSuggestion[] } | VideoSuggestion[]
  trendingTerms: { term: string; count: bigint }[]
}

export const SearchWithSuggestions = ({
  value,
  onChange,
  onSubmit,
  autoFocus,
}: SearchWithSuggestionsProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const debouncedValue = useDebounce(value, 300)

  const { data } = useQuery({
    queryKey: ["suggestions", debouncedValue],
    queryFn: () =>
      axiosInstance
        .get<SearchResponse>("/api/v1/search/term-suggestions", {
          params: { query: debouncedValue },
        })
        .then((res) => res.data),
    enabled: debouncedValue.trim().length > 1,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const videoList = Array.isArray(data?.videos)
    ? data.videos
    : (data?.videos as any)?.items || []

  const trendingList = data?.trendingTerms || []

  const hasResults = Boolean(trendingList.length || videoList.length)
  const isOpen = isFocused && value.trim().length > 1 && hasResults

  const goTo = (path: string) => {
    setIsFocused(false)
    router.navigate(path)
  }

  return (
    <Root open={isOpen}>
      <Trigger asChild>
        <div className="w-full">
          <SearchForm
            value={value}
            onChange={onChange}
            onSubmit={(e) => {
              setIsFocused(false)
              onSubmit(e)
            }}
            autoFocus={autoFocus}
            onFocus={() => setIsFocused(true)}
          />
        </div>
      </Trigger>

      <Portal>
        <Content
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          onInteractOutside={() => setIsFocused(false)}
          className="z-[9999] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border border-border bg-white shadow-lg dark:bg-zinc-900"
        >
          {trendingList.length > 0 && (
            <div className="py-1">
              {trendingList.map((term) => (
                <button
                  key={term.term}
                  type="button"
                  onMouseDown={(e) => {
                    // منع فقدان الـ Focus قبل تنفيذ الضغط
                    e.preventDefault()
                    goTo(`/search?q=${encodeURIComponent(term.term)}`)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-left"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{term.term}</span>
                </button>
              ))}
            </div>
          )}

          {videoList.length > 0 && (
            <div className="border-t border-border py-1">
              {videoList.map((video: VideoSuggestion) => (
                <button
                  key={video.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    goTo(`/watch/${video.id}`)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 hover:bg-muted text-left"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-9 w-14 shrink-0 rounded object-cover"
                  />
                  <span className="truncate text-sm">{video.title}</span>
                </button>
              ))}
            </div>
          )}
        </Content>
      </Portal>
    </Root>
  )
}
