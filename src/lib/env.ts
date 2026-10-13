const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`)
  }
  return value
}

export const env = {
  apiBaseUrl: required(
    import.meta.env.VITE_API_BASE_URL as string | undefined,
    "VITE_API_BASE_URL"
  ),
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as
      | string
      | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as
      | string
      | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
      | string
      | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  },
  firebaseVapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as
    | string
    | undefined,
} as const
