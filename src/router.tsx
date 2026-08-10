import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import { LoginPage } from "./features/Auth/pages/LoginPage"
import { SignUpPage } from "./features/Auth/pages/SignUpPage"
import { HomePage } from "./features/Auth/pages/HomePage"
import { SidebarLayout } from "./features/Auth/components/SidebarLayout"
import { SearchPage } from "./features/Search/pages/SearchPage"
import { VideoPage } from "./features/Video/pages/VideoPage"

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
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: "profile",
            element: <div>Profile Page</div>,
          },
          {
            path: "settings",
            element: <div>Settings Page</div>,
          },
          {
            path: "videos/:videoId",
            element: <VideoPage />,
          },
          {
            path: "search",
            element: <SearchPage />,
          },
        ],
      },
    ],
    ErrorBoundary: () => (
      <div className="flex h-screen w-full items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">
          Something went wrong, please try again later.
        </h1>
      </div>
    ),
  },
])
