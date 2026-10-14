importScripts(
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"
)
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js"
)

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "StreamPro"
  const data = payload.data || {}

  let url = "/notifications"
  if (data.url) {
    url = data.url
  } else if (data.type === "PLAYLIST" && data.playlistId) {
    url = `/playlist?list=${data.playlistId}`
  } else if (
    (data.type === "COMMENT" || data.type === "REPLY") &&
    data.videoId
  ) {
    url = `/videos/${data.videoId}${
      data.commentId ? `?commentId=${data.commentId}` : ""
    }`
  } else if (data.type === "SUBSCRIPTION" && data.channelId) {
    url = `/channels/${data.channelId}`
  } else if (data.type === "LIKE") {
    url = `/feed/liked`
  }

  const options = {
    body: payload.notification?.body || "",
    icon:
      payload.notification?.icon ||
      payload.notification?.image ||
      "/logo_icon.svg",
    badge: "/favicon.svg",
    image: payload.notification?.image,
    tag: data.notificationId || url, // collapses duplicates
    renotify: true,
    data: { url: new URL(url, self.location.origin).href },
  }

  return self.registration.showNotification(title, options)
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/notifications"
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client && "navigate" in client) {
            return client.navigate(url).then(() => client.focus())
          }
        }
        return clients.openWindow(url)
      })
  )
})
