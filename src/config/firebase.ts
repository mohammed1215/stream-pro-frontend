import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { queryClient } from "../main"

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const FIREBASE_VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

export const getFcmToken = async (): Promise<string | null> => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
    })
    if (currentToken) {
      return currentToken
    } else {
      alert(
        "No registration token available. Request permission to generate one."
      )
      return null
    }
  } catch (error) {
    console.error("Error fetching FCM token:", error)
    return null
  }
}

onMessage(messaging, (payload) => {
  console.log("Message received. ", payload)

  const notificationTitle = payload.notification?.title || "Notification"
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/firebase-logo.png",
  }

  // Show the native browser notification
  if (Notification.permission === "granted") {
    new Notification(notificationTitle, notificationOptions)
  }

  // Cancel any currently flying requests for notifications
  queryClient.cancelQueries({ queryKey: ["notifications"] })

  // Invalidate ALL notification queries, regardless of userId or pageNumber!
  queryClient.invalidateQueries({ queryKey: ["notifications"] })

  // make a sound of a notification
  const audio = new Audio("/notification-sound.wav")
  audio.play().catch((error) => {
    console.error("Error playing notification sound:", error)
  })
})
