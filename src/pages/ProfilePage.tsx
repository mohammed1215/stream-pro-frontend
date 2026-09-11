import { motion } from "framer-motion"
import {
  Mail,
  Edit3,
  Trash2,
  Video,
  Eye,
  Calendar,
  Laptop,
  ChevronRight,
  AlertTriangle,
  Upload,
  Loader2,
  Check,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { router } from "../router"
import { useMutation, useQuery } from "@tanstack/react-query"
import axiosInstance from "../lib/api"
import dayjs from "dayjs"
import { formatNumber } from "../lib/helpers"
import { useEffect, useState } from "react"
import { editProfile } from "../lib/auth"
import { useAuth } from "../features/Auth/hooks/useAuth"

// Animation configurations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
}

export const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* 1. Profile Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border/80 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-18 h-18 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-36 bg-muted rounded-md" />
            <div className="h-4 w-24 bg-muted/70 rounded-md" />
          </div>
        </div>
        <div className="h-9 w-28 bg-muted rounded-xl" />
      </div>

      {/* 2. Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center gap-4 p-5 bg-card border border-border/80 rounded-xl"
          >
            <div className="w-11 h-11 bg-muted rounded-xl shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-6 w-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Settings Card Skeleton */}
      <div className="p-6 bg-card border border-border/80 rounded-2xl space-y-4">
        <div className="h-5 w-32 bg-muted rounded-md mb-6" />
        <div className="space-y-4">
          <div className="h-10 bg-muted/40 rounded-lg w-full" />
          <div className="h-10 bg-muted/40 rounded-lg w-full" />
        </div>
      </div>
    </div>
  )
}

interface ProfileCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

export const ProfileCard = ({ title, value, icon }: ProfileCardProps) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className="flex items-center gap-4 p-5 bg-card border border-border/80 rounded-xl shadow-xs transition-shadow hover:shadow-md"
    >
      <div className="p-3 bg-muted rounded-xl text-primary">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <span className="text-2xl font-bold text-foreground mt-0.5 block">
          {value}
        </span>
      </div>
    </motion.div>
  )
}

export const ProfilePage = () => {
  const [editMode, setEditMode] = useState(false)

  const [progress, setProgress] = useState(0)

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const data = (
        await axiosInstance.get<{
          success: boolean
          data: {
            id: string
            email: string
            avatarUrl: string
            name: string
            createdAt: string
            updatedAt: string
            totalViews: number
            videoCount: number
          }
          meta: {}
        }>("/api/v1/profile/me")
      ).data
      return data.data
    },
  })

  const login = useAuth((state) => state.login)

  const [updateFormData, setUpdateFormData] = useState<{
    name: string
    avatar: File | null
  }>({ name: profileData?.name || "", avatar: null })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      return await editProfile(updateFormData, setProgress)
    },
    onSuccess: (data) => {
      setEditMode(false)
      setProgress(0)
      const localStorageUserData = {
        id: data.data.id,
        email: data.data.email,
        name: data.data.name,
        avatarUrl: data.data.avatarUrl,
      }

      login(
        {
          id: data.data.id,
          email: data.data.email,
          name: data.data.name,
          avatarUrl: data.data.avatarUrl,
        },
        localStorage.getItem("stream_token") || ""
      )
      localStorage.setItem("stream_user", JSON.stringify(localStorageUserData))
    },
  })

  useEffect(() => {
    function handleUpdateFormData() {
      setUpdateFormData({ name: profileData?.name || "", avatar: null })
      setAvatarPreview(profileData?.avatarUrl || null)
    }

    handleUpdateFormData()
  }, [profileData])

  const stats = [
    {
      title: "Videos",
      value: profileData?.videoCount || 0,
      icon: <Video className="w-5 h-5" />,
    },
    {
      title: "Total Views",
      value: formatNumber(profileData?.totalViews || 0),
      icon: <Eye className="w-5 h-5" />,
    },
    {
      title: "Joined",
      value: dayjs(profileData?.createdAt).format("MMM D, YYYY"),
      icon: <Calendar className="w-5 h-5" />,
    },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const Url = URL.createObjectURL(file)
      setUpdateFormData({ ...updateFormData, avatar: file })
      setAvatarPreview(Url)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        const Url = URL.createObjectURL(file)
        setUpdateFormData({ ...updateFormData, avatar: file })
        setAvatarPreview(Url)
      }
    }
  }

  const handleCancelEdit = () => {
    setUpdateFormData({
      name: profileData?.name || "",
      avatar: null,
    })
    setAvatarPreview(null)
    setEditMode(false)
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-foreground"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-card border border-border/80 rounded-2xl shadow-xs"
      >
        <div className="flex items-center gap-4">
          <div className="relative group">
            <motion.div
              onDragEnter={editMode ? handleDrag : undefined}
              onDragOver={editMode ? handleDrag : undefined}
              onDragLeave={editMode ? handleDrag : undefined}
              onDrop={editMode ? handleDrop : undefined}
              animate={{
                scale: isDragActive ? 1.08 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden relative transition-all duration-200 ${
                isDragActive
                  ? "ring-4 ring-primary ring-offset-2 ring-offset-card shadow-lg bg-primary/10"
                  : "ring-2 ring-primary/20 bg-muted"
              }`}
            >
              {avatarPreview || profileData?.avatarUrl ? (
                <img
                  src={avatarPreview || profileData?.avatarUrl}
                  alt="Avatar"
                  className={`w-full h-full object-cover transition-opacity duration-200 pointer-events-none ${
                    isDragActive ? "opacity-30 blur-[1px]" : "opacity-100"
                  }`}
                />
              ) : (
                <span
                  className={
                    isDragActive
                      ? "opacity-20 pointer-events-none"
                      : "opacity-100"
                  }
                >
                  {profileData?.name
                    ? profileData.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "ME"}
                </span>
              )}

              {editMode && isDragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center text-primary"
                >
                  <Upload className="w-6 h-6 animate-bounce" />
                  <span className="text-[10px] font-semibold tracking-wide mt-1">
                    Drop here
                  </span>
                </motion.div>
              )}
            </motion.div>

            {editMode ? (
              <label
                htmlFor="avatar"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <input
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  id="avatar"
                  name="avatar"
                  type="file"
                />
              </label>
            ) : (
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-card" />
            )}
          </div>

          <div>
            {editMode ? (
              <input
                type="text"
                value={updateFormData.name}
                onChange={(e) =>
                  setUpdateFormData({ ...updateFormData, name: e.target.value })
                }
                className="bg-transparent border-b border-border/80 focus:border-primary outline-none text-lg font-bold"
              />
            ) : (
              <h2 className="text-xl font-bold">{profileData?.name}</h2>
            )}
            <p className="text-sm text-muted-foreground">
              Content Creator • Pro Plan
            </p>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          {editMode ? (
            <div className="flex items-center gap-2">
              {/* Cancel Button */}
              <Button
                type="button"
                variant="ghost"
                disabled={updateProfileMutation.isPending}
                onClick={handleCancelEdit}
                className="rounded-xl text-sm font-medium hover:bg-muted"
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={updateProfileMutation.isPending}
                onClick={() => updateProfileMutation.mutate()}
                className="relative overflow-hidden rounded-xl text-sm font-medium min-w-[135px] shadow-sm transition-all"
              >
                {updateProfileMutation.isPending && (
                  <span
                    className="absolute inset-y-0 left-0 bg-primary-foreground/20 transition-all duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{progress > 0 ? `${progress}%` : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 rounded-xl text-sm font-medium border-border/80 hover:bg-muted"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((card) => (
          <ProfileCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>

      <motion.div
        variants={itemVariants}
        className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs space-y-4"
      >
        <h3 className="text-lg font-semibold tracking-tight">
          Account Settings
        </h3>

        <div className="divide-y divide-border/60">
          {/* Email Row */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-sm font-medium">{profileData?.email}</p>
              </div>
            </div>
          </div>

          {/* Active Sessions Row */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-xs text-muted-foreground">
                  Manage devices where your account is currently signed in
                </p>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.navigate("/sessions")}
                className="flex items-center gap-1.5 rounded-lg text-xs font-medium border-border/80 hover:bg-muted cursor-pointer"
              >
                Manage
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="border border-destructive/30 bg-destructive/5 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-destructive/10 text-destructive mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-destructive">
              Delete Account
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently remove your personal data, channels, and active
              subscriptions.
            </p>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </Button>
        </motion.div>
      </motion.div>
    </motion.section>
  )
}
