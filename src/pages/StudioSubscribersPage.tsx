import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"

import { getChannelSubscribers } from "../lib/subscriptionApi"

/* ---------- types (mirror the backend DTOs) ---------- */
export interface Subscriber {
  subscriptionId: string
  channelId: string
  userId: string
  userChannelId: string | null
  name: string
  email: string
  avatarUrl: string | null
  channelTitle: string | null
  channelThumbnailUrl: string | null
  channelImageUrl: string | null
  createdAt: string // Date arrives as an ISO string over JSON
}

export interface PaginatedSubscribers {
  items: Subscriber[]
  pageNumber: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  totalPages: number
}

/* ---------- data layer ---------- */
const PAGE_SIZE = 20

const subscribersKeys = {
  list: (page: number) => ["studio", "subscribers", page] as const,
}

const fetchSubscribers = async (page: number) => {
  const data = await getChannelSubscribers(page, PAGE_SIZE)
  return data
}

function useSubscribers(page: number) {
  return useQuery({
    queryKey: subscribersKeys.list(page),
    queryFn: () => fetchSubscribers(page),
    placeholderData: keepPreviousData,
  })
}

/* ---------- helpers ---------- */
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

function timeAgo(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size)
      return rtf.format(Math.round(seconds / size), unit)
  }
  return "just now"
}

const fullDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en", { dateStyle: "medium" })

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")

/* ---------- styles: Tailwind utilities wired to your theme variables ---------- */
const ring =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]"

const ui = {
  card: "overflow-hidden rounded-[var(--radius)] border border-[color:var(--border)] bg-[var(--background)]",
  th: "bg-[var(--background-secondary)] px-2 py-2.5 text-[0.8125rem] font-medium text-[color:var(--muted-foreground)] border-b border-[color:var(--border)] first:pl-4 last:pr-4 last:text-right",
  td: "px-2 py-3 align-middle first:pl-4 last:pr-4 last:text-right",
  row: "border-b border-[color:var(--border)] last:border-0 transition-colors hover:bg-[var(--background-secondary)] focus-within:bg-[var(--background-secondary)]",
  muted: "text-sm text-[color:var(--muted-foreground)]",
  btn: `inline-flex items-center gap-1 rounded-[calc(var(--radius)/1.5)] border border-[color:var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[var(--background-secondary-hover)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[var(--background)] ${ring}`,
  btnPrimary: `inline-flex items-center rounded-[calc(var(--radius)/1.5)] border border-[color:var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[color:var(--primary-foreground)] hover:brightness-110 ${ring}`,
}

/* ---------- small UI pieces ---------- */
function Avatar({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false) // broken URL → fall back to initials
  return (
    <span
      aria-hidden
      className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--accent-border)] bg-[var(--accent-bg)] text-[0.8125rem] font-semibold text-[color:var(--accent-foreground)]"
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  )
}

function Skeleton({ className }: { className: string }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-[var(--background-secondary-hover)] motion-reduce:animate-none ${className}`}
    />
  )
}

/* ---------- table parts ---------- */
function SubscriberRow({ s }: { s: Subscriber }) {
  const navigate = useNavigate()
  // Subscribers without a channel have nowhere to go, so their row isn't clickable
  const channelPath = s.userChannelId ? `/channels/${s.userChannelId}` : null

  return (
    <tr
      className={`${ui.row} ${channelPath ? "cursor-pointer" : ""}`}
      // Mouse convenience: the whole row is clickable.
      // Keyboard and screen readers use the real <Link> on the name below.
      onClick={channelPath ? () => navigate(channelPath) : undefined}
    >
      <td className={ui.td}>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={s.avatarUrl} name={s.name} />
          <div className="min-w-0">
            {channelPath ? (
              <Link
                to={channelPath}
                onClick={(e) => e.stopPropagation()} // avoid navigating twice
                className={`block truncate rounded-sm font-medium text-[color:var(--foreground)] hover:text-[color:var(--accent-hover)] hover:underline ${ring}`}
              >
                {s.name}
              </Link>
            ) : (
              <p className="truncate font-medium">{s.name}</p>
            )}
            <p className={`truncate ${ui.muted}`}>{s.email}</p>
          </div>
        </div>
      </td>

      <td className={ui.td}>
        <time
          dateTime={s.createdAt}
          title={fullDate(s.createdAt)}
          className="whitespace-nowrap text-sm"
        >
          {timeAgo(s.createdAt)}
        </time>
      </td>
    </tr>
  )
}

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className={ui.row}>
          <td className={ui.td}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="grid gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </td>
          <td className={ui.td}>
            <Skeleton className="ml-auto h-3.5 w-20" />
          </td>
        </tr>
      ))}
    </>
  )
}

/* ---------- page ---------- */
export const StudioSubscribersPage = () => {
  // The page lives in the URL: refresh, back button and sharing all work
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get("page")) || 1)

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useSubscribers(page)

  const goTo = (p: number) => {
    setParams({ page: String(p) })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isEmpty = !isPending && !isError && data?.items.length === 0

  return (
    <div className="mx-auto w-full max-w-5xl p-4 text-[color:var(--foreground)] md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Subscribers</h1>
        <p className={`mt-1 ${ui.muted}`}>
          People who follow your channel, newest first.
        </p>
      </header>

      {/* --shadow is a full box-shadow value, so it's applied inline */}
      <div className={ui.card} style={{ boxShadow: "var(--shadow)" }}>
        {isError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <p className="font-medium">Couldn't load your subscribers</p>
            <p className={`max-w-sm ${ui.muted}`}>
              Check your connection and try again.
            </p>
            <button className={ui.btnPrimary} onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <Users
              size={40}
              aria-hidden
              className="text-[color:var(--muted-foreground)]"
            />
            <p className="font-medium">No subscribers yet</p>
            <p className={`max-w-sm ${ui.muted}`}>
              Upload videos and share your channel link. New subscribers will
              show up here.
            </p>
          </div>
        ) : (
          <table
            aria-busy={isPending || isPlaceholderData}
            className={`w-full border-collapse text-left transition-opacity ${
              isPlaceholderData ? "opacity-60" : ""
            }`}
          >
            <thead>
              <tr>
                <th scope="col" className={ui.th}>
                  Subscriber
                </th>
                <th scope="col" className={ui.th}>
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <RowsSkeleton />
              ) : (
                data.items.map((s) => (
                  <SubscriberRow key={s.subscriptionId} s={s} />
                ))
              )}
            </tbody>
          </table>
        )}

        {data && data.totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between border-t border-[color:var(--border)] bg-[var(--background-secondary)] px-4 py-3"
          >
            <p className={ui.muted}>
              Page {data.pageNumber} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                className={ui.btn}
                disabled={!data.hasPreviousPage}
                onClick={() => goTo(page - 1)}
              >
                <ChevronLeft size={16} aria-hidden /> Previous
              </button>
              <button
                className={ui.btn}
                disabled={!data.hasNextPage || isPlaceholderData}
                onClick={() => goTo(page + 1)}
              >
                Next <ChevronRight size={16} aria-hidden />
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
