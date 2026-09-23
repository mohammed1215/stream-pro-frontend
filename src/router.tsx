import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import { LoginPage } from "./features/Auth/pages/LoginPage"
import { SignUpPage } from "./features/Auth/pages/SignUpPage"
import { HomePage } from "./features/Auth/pages/HomePage"
import { SidebarLayout } from "./features/Auth/components/SidebarLayout"
import { SearchPage } from "./features/Search/pages/SearchPage"
import { VideoPage } from "./features/Video/pages/VideoPage"
import { ChannelDetailsPage } from "./pages/ChannelDetailsPage"
import { StudioLayout } from "./components/StudioLayout"
import { StudioDashboardPage } from "./pages/StudioDashboardPage"
import { StudioContentPage } from "./pages/StudioContentPage"
import { StudioEditVideoPage } from "./pages/EditVideoPage"
import { HistoryPage } from "./pages/HistoryPage"
import { WatchLaterPage } from "./pages/WatchLaterPage"
import { PlaylistsPage } from "./pages/PlaylistsPage"
import { PlaylistPage } from "./pages/PlaylistPage"
import { LikedVideosPage } from "./pages/LikedVideosPage"
import { SubscriptionsPage } from "./pages/SubscriptionsPage"
import { SessionsPage } from "./pages/SessionsPage"
import { ProfilePage } from "./pages/ProfilePage"
import { StudioChannelCustomizationPage } from "./pages/StudioChannelCustomizationPage"

export const router = createBrowserRouter([
  {
    path: "*",
    element: <App />,
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
          { path: "search", element: <SearchPage /> },

          {
            path: "feed/subscriptions",
            element: <SubscriptionsPage />,
          },
          { path: "feed/liked", element: <LikedVideosPage /> },
          { path: "feed/watchlater", element: <WatchLaterPage /> },
          { path: "feed/playlists", element: <PlaylistsPage /> },
          { path: "feed/history", element: <HistoryPage /> },

          {
            path: "playlist",
            element: <PlaylistPage />,
          },

          { path: "notifications", element: <div>All Notifications</div> },

          { path: "videos/:videoId", element: <VideoPage /> },
          { path: "channels/:channelId", element: <ChannelDetailsPage /> },
          { path: "sessions", element: <SessionsPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "settings", element: <div>Settings Page</div> },
        ],
      },
      {
        path: "studio",
        element: <StudioLayout />,
        children: [
          { index: true, element: <StudioDashboardPage /> },
          { path: "content", element: <StudioContentPage /> },
          { path: "content/:videoId/edit", element: <StudioEditVideoPage /> },

          { path: "upload", element: <div>Upload Video Flow</div> },

          { path: "analytics", element: <div>Analytics</div> },
          { path: "comments", element: <div>Comments Moderation</div> },

          {
            path: "channel/customization",
            element: <StudioChannelCustomizationPage />,
          },
        ],
      },
    ],
  },
])
