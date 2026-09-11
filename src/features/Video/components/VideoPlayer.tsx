import "@vidstack/react/player/styles/base.css"
import {
  MediaPlayer,
  MediaProvider,
  Time,
  CaptionButton,
  MuteButton,
  FullscreenButton,
  Controls,
  PlayButton,
  TimeSlider,
  VolumeSlider,
  Gesture,
  useMediaRemote,
  useMediaState,
  MediaPlayerInstance,
  Menu,
  usePlaybackRateOptions,
  useVideoQualityOptions,
} from "@vidstack/react"
import {
  PlayIcon,
  PauseIcon,
  ReplayIcon,
  MuteIcon,
  VolumeLowIcon,
  VolumeHighIcon,
  FullscreenIcon,
  FullscreenExitIcon,
  ClosedCaptionsIcon,
  ClosedCaptionsOnIcon,
  SeekForward10Icon,
  SeekBackward10Icon,
} from "@vidstack/react/icons"
import { useEffect, useRef, useState } from "react"
import { Play, Settings, TimerIcon } from "lucide-react"
import { cn } from "../../../lib/utils"
import { trackProgress } from "../../../lib/watchHistory"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { recordViewApi } from "../../../lib/video"

const SLIDER_FILL = "var(--slider-fill)"

const radioClassName =
  "ring-sky-400 group relative flex w-full cursor-pointer select-none items-center justify-start rounded-md px-2.5 py-2 text-sm text-white/90 outline-none transition-colors data-[checked]:bg-white/20! data-[hocus]:bg-white/10 data-[focus]:ring-[3px]"

export const SpeedMenu = () => {
  const options = usePlaybackRateOptions()

  const hint =
    options.selectedValue === "1" ? "Normal" : options.selectedValue + "x"

  return (
    <Menu.Root className="relative">
      <Menu.Button className="group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white! transition-colors hover:bg-white/20">
        <TimerIcon className="h-5 w-5" />

        {/* Floating hover label, does not affect layout */}
        <span
          className="
            pointer-events-none absolute left-full top-1/2 z-50 ml-2
            -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md
            bg-black/80 px-2 py-1 text-xs font-medium opacity-0
            transition-all duration-200
            group-hover:translate-x-0 group-hover:opacity-100
          "
        >
          {hint}
        </span>
      </Menu.Button>

      <Menu.Content
        className={cn(
          // positioning
          "absolute bottom-full right-0 z-50 mb-2 w-40 max-h-56 overflow-y-auto",

          // visual style
          "origin-bottom-right rounded-lg border border-white/10 bg-zinc-950/95 p-1 shadow-xl backdrop-blur",

          // closed state
          "invisible opacity-0 scale-95 translate-y-1 transition-all duration-200",

          // open state
          "data-[open]:visible data-[open]:opacity-100 data-[open]:scale-100 data-[open]:translate-y-0",

          // enter animation, useful if the content gets mounted only when opened
          "data-[open]:animate-[menu-in_180ms_ease-out]"
        )}
      >
        <Menu.RadioGroup
          className="flex w-full flex-col gap-1"
          value={options.selectedValue}
        >
          {options.map(({ label, value, select }) => (
            <Menu.Radio
              className={radioClassName}
              value={value}
              onSelect={select}
              key={value}
            >
              {label}
            </Menu.Radio>
          ))}
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu.Root>
  )
}

export const QualityMenu = () => {
  const options = useVideoQualityOptions({ sort: "descending" })

  // إذا كان الفيديو لا يحتوي على جودات متعددة (مثل ملف MP4 عادي)، يتم إخفاء الزر تلقائياً
  if (!options.length) return null

  const hint = options.selectedQuality?.height
    ? `${options.selectedQuality.height}p`
    : "Auto"

  return (
    <Menu.Root className="relative">
      <Menu.Button className="group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/20">
        <Settings className="h-5 w-5" />

        {/* تلميح عند التحويم (Hover Hint) */}
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-medium opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          {hint}
        </span>
      </Menu.Button>

      <Menu.Content
        className={cn(
          "absolute bottom-full right-0 z-50 mb-2 max-h-56 w-36 overflow-y-auto",
          "origin-bottom-right rounded-lg border border-white/10 bg-zinc-950/95 p-1 shadow-xl backdrop-blur",
          "invisible scale-95 translate-y-1 opacity-0 transition-all duration-200",
          "data-[open]:visible data-[open]:scale-100 data-[open]:translate-y-0 data-[open]:opacity-100"
        )}
      >
        <Menu.RadioGroup
          className="flex w-full flex-col gap-1"
          value={options.selectedValue}
        >
          {options.map(({ label, value, select }) => (
            <Menu.Radio
              key={value}
              value={value}
              onSelect={select}
              className={radioClassName}
            >
              {label}
            </Menu.Radio>
          ))}
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu.Root>
  )
}

export const CustomVideoPlayer = ({
  src,
  title,
  videoId,
}: {
  src: string
  title: string
  videoId: string
}) => {
  const [isRemainder, setIsRemainder] = useState(false)
  const [edgeZoneTriggered, setEdgeZoneTriggered] = useState({
    left: false,
    right: false,
  })

  const leftTimeout = useRef<ReturnType<typeof setTimeout>>(null)
  const rightTimeout = useRef<ReturnType<typeof setTimeout>>(null)

  const playerRef = useRef<MediaPlayerInstance>(null)
  const remote = useMediaRemote(playerRef)
  const volume = useMediaState("volume", playerRef)
  const currentTime = useMediaState("currentTime", playerRef)
  const duration = useMediaState("duration", playerRef)
  const lastSentRef = useRef(0)

  const queryClient = useQueryClient()

  const handleVolumeWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    console.log(e.deltaY)
    const step = 0.05
    const delta = e.deltaY < 0 ? step : -step
    const next = Math.min(1, Math.max(0, volume + delta))
    remote.changeVolume(next, e.nativeEvent)
  }

  const { mutate: mutateTrack } = useMutation({
    mutationFn: ({
      videoId,
      watchedSeconds,
    }: {
      videoId: string
      watchedSeconds: number
    }) => trackProgress(videoId, watchedSeconds),
  })

  const { mutate: recordView } = useMutation({
    mutationFn: recordViewApi,
    onSuccess: () => {
      console.log("View recorded successfully")
      queryClient.invalidateQueries({ queryKey: ["video-details"] })
    },
  })

  useEffect(() => {
    if (
      currentTime - lastSentRef.current >= 15 ||
      currentTime === 0 ||
      currentTime === duration
    ) {
      lastSentRef.current = currentTime
      mutateTrack({ videoId, watchedSeconds: Math.floor(currentTime) })
    }

    if (currentTime > 5 && lastSentRef.current === 0) {
      lastSentRef.current = currentTime
      recordView(videoId)
    }
  }, [currentTime, videoId, mutateTrack, duration])

  return (
    <MediaPlayer
      ref={playerRef}
      title={title}
      src={src}
      className="relative aspect-video"
    >
      {/* Only this layer is rounded + clipped */}
      <div className="absolute inset-0 rounded-lg overflow-hidden bg-black">
        <MediaProvider />
      </div>

      {/* Full-size, base layer */}
      <Gesture
        className="absolute inset-0 z-0"
        event="pointerup"
        action="toggle:paused"
      />
      <Gesture
        className="absolute inset-0 z-0"
        event="dblpointerup"
        action="toggle:fullscreen"
      />

      {/* Edge zones sit ABOVE the full-size layer so they win there */}
      <Gesture
        className="absolute left-0 top-0 z-10 h-full w-1/3 transition-all duration-500"
        style={{
          backgroundColor: edgeZoneTriggered.left
            ? "rgba(255, 255, 255, 0.2)"
            : "transparent",
        }}
        event="dblpointerup"
        action="seek:-10"
        onWillTrigger={() => {
          setEdgeZoneTriggered((prev) => ({ ...prev, left: true }))
          clearTimeout(leftTimeout.current ?? undefined)
          leftTimeout.current = setTimeout(
            () => setEdgeZoneTriggered((prev) => ({ ...prev, left: false })),
            500
          )
        }}
      >
        <SeekBackward10Icon
          className={`${
            edgeZoneTriggered.left ? "text-white" : "text-transparent"
          } absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 p-3 rounded-full rotate-180 transition-all duration-500`}
        />
      </Gesture>

      <Gesture
        className="absolute right-0 top-0 z-10 h-full w-1/3 transition-all duration-500"
        style={{
          backgroundColor: edgeZoneTriggered.right
            ? "rgba(255, 255, 255, 0.2)"
            : "transparent",
        }}
        event="dblpointerup"
        action="seek:10"
        onWillTrigger={() => {
          setEdgeZoneTriggered((prev) => ({ ...prev, right: true }))
          clearTimeout(rightTimeout.current ?? undefined)
          rightTimeout.current = setTimeout(
            () => setEdgeZoneTriggered((prev) => ({ ...prev, right: false })),
            500
          )
        }}
      >
        <SeekForward10Icon
          className={`${
            edgeZoneTriggered.right ? "text-white" : "text-transparent"
          } absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 p-3 rounded-full  transition-all duration-500`}
        />
      </Gesture>

      <Controls.Root
        hideDelay={1000}
        className="absolute bottom-0 left-2 right-3 rounded-b-lg bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity duration-200 media-controls:opacity-100"
      >
        <Controls.Group className="flex flex-wrap items-center gap-2 text-white">
          {" "}
          <PlayButton className="relative w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0 cursor-pointer">
            <PlayIcon className="w-6 h-6 shrink-0 block media-playing:hidden" />
            <PauseIcon className="w-6 h-6 shrink-0 hidden media-playing:block" />
            <ReplayIcon className="w-6 h-6 shrink-0 hidden media-ended:block" />
          </PlayButton>
          <button
            onClick={() => setIsRemainder(!isRemainder)}
            className="text-sm tabular-nums cursor-pointer hover:bg-white/30 transition-all rounded-sm px-1.5 py-0.5 flex items-center justify-center shrink-0"
          >
            <Time
              type="current"
              remainder={isRemainder}
              className="tabular-nums"
            />
          </button>
          <span className="text-sm opacity-70 shrink-0">/</span>
          <Time
            type="duration"
            className="text-sm tabular-nums opacity-70 shrink-0"
          />
          {/* Time slider */}
          <TimeSlider.Root
            aria-label="Seek"
            className="group/slider relative h-4 min-w-0 flex-1 flex items-center cursor-pointer touch-none select-none"
          >
            <TimeSlider.Track className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
              <TimeSlider.TrackFill
                className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-white"
                style={{ width: SLIDER_FILL }}
              />
              <TimeSlider.Progress className="absolute z-10 h-full w-(--slider-progress) rounded-sm bg-white/50" />
            </TimeSlider.Track>

            <TimeSlider.Thumb
              className="pointer-events-none absolute top-1/2 z-10 h-3 w-3 rounded-full bg-white opacity-0 transition-opacity group-hover/slider:opacity-100"
              style={{ left: SLIDER_FILL, transform: "translate(-50%, -50%)" }}
            />
          </TimeSlider.Root>
          <CaptionButton className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
            <ClosedCaptionsIcon className="w-6 h-6 shrink-0 block media-captions:hidden" />
            <ClosedCaptionsOnIcon className="w-6 h-6 shrink-0 hidden media-captions:block" />
          </CaptionButton>
          <SpeedMenu />
          <QualityMenu />
          <Controls.Group
            className="group/volume relative flex items-center shrink-0"
            onWheel={handleVolumeWheel}
          >
            <MuteButton className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
              <VolumeHighIcon className="w-6 h-6 shrink-0 block media-muted:hidden media-volume-low:hidden" />
              <VolumeLowIcon className="w-6 h-6 shrink-0 hidden media-volume-low:block" />
              <MuteIcon className="w-6 h-6 shrink-0 hidden media-muted:block" />
            </MuteButton>

            <div
              className="
                invisible absolute bottom-full left-1/2 z-50 -translate-x-1/2
                pb-2 opacity-0 transition-all duration-150
                group-hover/volume:visible group-hover/volume:opacity-100
                group-focus-within/volume:visible group-focus-within/volume:opacity-100
              "
            >
              <div className="h-28 w-10 rounded-lg bg-black/80 p-3">
                <VolumeSlider.Root
                  aria-label="Volume"
                  orientation="vertical"
                  className="relative flex h-full cursor-pointer touch-none select-none justify-center"
                >
                  <VolumeSlider.Track className="relative h-full w-1 overflow-hidden rounded-full bg-white/20">
                    <VolumeSlider.TrackFill
                      className="pointer-events-none absolute bottom-0 left-0 w-full rounded-full bg-white"
                      style={{ height: SLIDER_FILL }}
                    />
                  </VolumeSlider.Track>

                  <VolumeSlider.Thumb
                    className="pointer-events-none absolute left-1/2 z-10 h-3 w-3 rounded-full bg-white"
                    style={{
                      bottom: SLIDER_FILL,
                      transform: "translate(-50%, 50%)",
                    }}
                  />
                </VolumeSlider.Root>
              </div>
            </div>
          </Controls.Group>
          <FullscreenButton className="w-10 h-10 rounded-full cursor-pointer hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
            <FullscreenIcon className="w-6 h-6 shrink-0 block media-fullscreen:hidden" />
            <FullscreenExitIcon className="w-6 h-6 shrink-0 hidden media-fullscreen:block" />
          </FullscreenButton>
        </Controls.Group>
      </Controls.Root>
    </MediaPlayer>
  )
}
