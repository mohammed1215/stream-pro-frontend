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

onMessage(messaging, (payload) => {
  const notificationTitle = payload.notification?.title || "Notification"
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/firebase-logo.png",
  }

  // Show the native browser notification
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "granted"
  ) {
    new Notification(notificationTitle, notificationOptions)
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
