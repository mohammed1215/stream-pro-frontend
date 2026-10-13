import { lazy } from "react"

// Route-level code splitting. Layouts and the home/auth pages stay in the
// initial bundle; everything else loads on demand. This module only exports
// lazy page components.
export const SearchPage = lazy(() =>
  import("./features/Search/pages/SearchPage").then((m) => ({
    default: m.SearchPage,
  }))
)
export const VideoPage = lazy(() =>
  import("./features/Video/pages/VideoPage").then((m) => ({
    default: m.VideoPage,
  }))
)
export const ChannelDetailsPage = lazy(() =>
  import("./pages/ChannelDetailsPage").then((m) => ({
    default: m.ChannelDetailsPage,
  }))
)
export const SubscriptionsPage = lazy(() =>
  import("./pages/SubscriptionsPage").then((m) => ({
    default: m.SubscriptionsPage,
  }))
)
export const LikedVideosPage = lazy(() =>
  import("./pages/LikedVideosPage").then((m) => ({
    default: m.LikedVideosPage,
  }))
)
export const WatchLaterPage = lazy(() =>
  import("./pages/WatchLaterPage").then((m) => ({
    default: m.WatchLaterPage,
  }))
)
export const PlaylistsPage = lazy(() =>
  import("./pages/PlaylistsPage").then((m) => ({
    default: m.PlaylistsPage,
  }))
)
export const PlaylistPage = lazy(() =>
  import("./pages/PlaylistPage").then((m) => ({
    default: m.PlaylistPage,
  }))
)
export const HistoryPage = lazy(() =>
  import("./pages/HistoryPage").then((m) => ({
    default: m.HistoryPage,
  }))
)
export const SessionsPage = lazy(() =>
  import("./pages/SessionsPage").then((m) => ({
    default: m.SessionsPage,
  }))
)
export const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  }))
)
export const StudioDashboardPage = lazy(() =>
  import("./pages/StudioDashboardPage").then((m) => ({
    default: m.StudioDashboardPage,
  }))
)
export const StudioContentPage = lazy(() =>
  import("./pages/StudioContentPage").then((m) => ({
    default: m.StudioContentPage,
  }))
)
export const StudioEditVideoPage = lazy(() =>
  import("./pages/EditVideoPage").then((m) => ({
    default: m.StudioEditVideoPage,
  }))
)
export const StudioSubscribersPage = lazy(() =>
  import("./pages/StudioSubscribersPage").then((m) => ({
    default: m.StudioSubscribersPage,
  }))
)
export const StudioCommentsPage = lazy(() =>
  import("./pages/StudioCommentsPage").then((m) => ({
    default: m.StudioCommentsPage,
  }))
)
export const StudioChannelCustomizationPage = lazy(() =>
  import("./pages/StudioChannelCustomizationPage").then((m) => ({
    default: m.StudioChannelCustomizationPage,
  }))
)
