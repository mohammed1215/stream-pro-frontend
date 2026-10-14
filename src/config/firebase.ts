import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { queryClient } from "../lib/queryClient"
import { env } from "../lib/env"

export const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
}

export const FIREBASE_VAPID_KEY = env.firebaseVapidKey

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

export const getFcmToken = async (): Promise<string | null> => {
  try {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      await Notification.requestPermission()
    }
    const currentToken = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
    })
    return currentToken || null
  } catch {
    return null
  }
}

function getUrlFromFcmData(data?: Record<string, string>): string | null {
  if (!data) return null
  if (data.url) return data.url
  switch (data.type) {
    case "PLAYLIST":
      return data.playlistId ? `/playlist?list=${data.playlistId}` : null
    case "REPLY":
    case "COMMENT":
      return data.videoId
        ? `/videos/${data.videoId}${data.commentId ? `?commentId=${data.commentId}` : ""}`
        : null
    case "SUBSCRIPTION":
      return data.channelId ? `/channels/${data.channelId}` : null
    case "LIKE":
      return "/feed/liked"
    default:
      return null
  }
}

onMessage(messaging, (payload) => {
  const notificationTitle = payload.notification?.title || "StreamPro"
  const url = getUrlFromFcmData(payload.data) || "/notifications"
  const notificationOptions: NotificationOptions & { data?: { url: string } } = {
    body: payload.notification?.body || "",
    icon:
      payload.notification?.icon ||
      (payload.notification as { image?: string } | undefined)?.image ||
      "/logo_icon.svg",
    badge: "/favicon.svg",
    tag: payload.data?.notificationId || url,
    renotify: true,
    data: { url },
  }

  // Show the native browser notification
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "granted"
  ) {
    const n = new Notification(notificationTitle, notificationOptions)
    n.onclick = (event) => {
      event.preventDefault()
      window.focus()
      window.location.href = n.data?.url || "/notifications"
      n.close()
    }
  }

  // Cancel any currently flying requests for notifications, then
  // invalidate ALL notification queries, regardless of userId/pageNumber.
  void queryClient.cancelQueries({ queryKey: ["notifications"] }).then(() => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] })
  })

  // make a sound of a notification (public/notification_sound.wav)
  const audio = new Audio("/notification_sound.wav")
  audio.play().catch(() => {
    // Silently ignore autoplay blocks / missing file.
  })
})
