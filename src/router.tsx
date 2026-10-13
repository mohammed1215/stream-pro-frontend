import { Suspense, type ReactNode } from "react"
import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import { LoginPage } from "./features/Auth/pages/LoginPage"
import { SignUpPage } from "./features/Auth/pages/SignUpPage"
import { HomePage } from "./features/Auth/pages/HomePage"
import { SidebarLayout } from "./features/Auth/components/SidebarLayout"
import { StudioLayout } from "./components/StudioLayout"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { NotFoundPage } from "./pages/NotFoundPage"
import { PageFallback } from "./components/PageFallback"
import {
  ChannelDetailsPage,
  HistoryPage,
  LikedVideosPage,
  PlaylistPage,
  PlaylistsPage,
  ProfilePage,
  SearchPage,
  SessionsPage,
  StudioChannelCustomizationPage,
  StudioCommentsPage,
  StudioContentPage,
  StudioDashboardPage,
  StudioEditVideoPage,
  StudioSubscribersPage,
  SubscriptionsPage,
  VideoPage,
  WatchLaterPage,
} from "./lazyPages"

const withSuspense = (node: ReactNode) => (
  <Suspense fallback={<PageFallback />}>{node}</Suspense>
)

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: "login",
        element: (
          <div className="overflow-hidden">
            <LoginPage />
          </div>
        ),
      },
      {
        path: "signup",
        element: (
          <div className="overflow-hidden">
            <SignUpPage />
          </div>
        ),
      },
      {
        element: <SidebarLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "search", element: withSuspense(<SearchPage />) },
          { path: "videos/:videoId", element: withSuspense(<VideoPage />) },
          {
            path: "channels/:channelId",
            element: withSuspense(<ChannelDetailsPage />),
          },
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: "feed/subscriptions",
                element: withSuspense(<SubscriptionsPage />),
              },
              {
                path: "feed/liked",
                element: withSuspense(<LikedVideosPage />),
              },
              {
                path: "feed/watchlater",
                element: withSuspense(<WatchLaterPage />),
              },
              {
                path: "feed/playlists",
                element: withSuspense(<PlaylistsPage />),
              },
              {
                path: "feed/history",
                element: withSuspense(<HistoryPage />),
              },
              { path: "playlist", element: withSuspense(<PlaylistPage />) },
              { path: "notifications", element: <div>All Notifications</div> },
              { path: "sessions", element: withSuspense(<SessionsPage />) },
              { path: "profile", element: withSuspense(<ProfilePage />) },
              { path: "settings", element: <div>Settings Page</div> },
            ],
          },
        ],
      },
      {
        path: "studio",
        element: <ProtectedRoute />,
        children: [
          {
            element: <StudioLayout />,
            children: [
              {
                index: true,
                element: withSuspense(<StudioDashboardPage />),
              },
              {
                path: "content",
                element: withSuspense(<StudioContentPage />),
              },
              {
                path: "content/:videoId/edit",
                element: withSuspense(<StudioEditVideoPage />),
              },
              {
                path: "content/subscribers",
                element: withSuspense(<StudioSubscribersPage />),
              },
              { path: "upload", element: <div>Upload Video Flow</div> },
              { path: "analytics", element: <div>Analytics</div> },
              {
                path: "comments",
                element: withSuspense(<StudioCommentsPage />),
              },
              {
                path: "channel/customization",
                element: withSuspense(<StudioChannelCustomizationPage />),
              },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
