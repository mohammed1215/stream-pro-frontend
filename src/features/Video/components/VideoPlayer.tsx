import "@vidstack/react/player/styles/base.css"
import {
  MediaPlayer,
  MediaProvider,
  Time,
  CaptionButton,
  MuteButton,
  FullscreenButton,
  PIPButton,
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
  PictureInPictureIcon,
  PictureInPictureExitIcon,
  ClosedCaptionsIcon,
  ClosedCaptionsOnIcon,
  SeekForward10Icon,
  SeekBackward10Icon,
} from "@vidstack/react/icons"
import { useEffect, useRef, useState } from "react"
import { Settings, TimerIcon, AlertTriangle, RotateCcw } from "lucide-react"
import { cn } from "../../../lib/utils"
import { trackProgress } from "../../../lib/watchHistory"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { recordViewApi } from "../../../lib/video"

const SLIDER_FILL = "var(--slider-fill)"

const ICON_BTN =
  "group relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/90 outline-none transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-90 focus-visible:ring-2 focus-visible:ring-[#f2a93c]/70"

const PLAY_BTN =
  "group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white outline-none transition-all duration-150 hover:bg-white/10 active:scale-90 focus-visible:ring-2 focus-visible:ring-[#f2a93c]/70"

const GROUP_DIVIDER = "mx-1 h-5 w-px shrink-0 bg-white/15"

const GLASS_PILL =
  "flex items-center gap-0.5 rounded-full border border-white/10 bg-white/8 px-1.5 py-1 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl"

const radioClassName =
  "group relative flex w-full cursor-pointer select-none items-center justify-start rounded-md px-2.5 py-2 text-sm text-white/85 outline-none transition-colors data-[checked]:bg-[#f2a93c]/15! data-[checked]:text-[#f2a93c] data-[hocus]:bg-white/8 data-[focus]:ring-2 data-[focus]:ring-[#f2a93c]/60"

export const SpeedMenu = () => {
  const options = usePlaybackRateOptions()
  const hint =
    options.selectedValue === "1" ? "Normal" : options.selectedValue + "x"

  return (
    <Menu.Root className="relative">
      <Menu.Button className={ICON_BTN}>
        <TimerIcon className="h-[18px] w-[18px]" />
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-medium tracking-wide text-white/90 opacity-0 transition-all duration-150 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100">
          {hint}
        </span>
      </Menu.Button>

      <Menu.Content
        className={cn(
          "absolute bottom-full right-0 z-50 mb-2 w-40 max-h-56 overflow-y-auto",
          "origin-bottom-right rounded-xl border border-white/10 bg-[#101114]/95 p-1 shadow-2xl backdrop-blur-xl",
          "invisible opacity-0 scale-95 translate-y-1 transition-all duration-200",
          "data-[open]:visible data-[open]:opacity-100 data-[open]:scale-100 data-[open]:translate-y-0"
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
  if (!options.length) return null

  const hint = options.selectedQuality?.height
    ? `${options.selectedQuality.height}p`
    : "Auto"

  return (
    <Menu.Root className="relative">
      <Menu.Button className={ICON_BTN}>
        <Settings className="h-[18px] w-[18px]" />
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-medium tracking-wide text-white/90 opacity-0 transition-all duration-150 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100">
          {hint}
        </span>
      </Menu.Button>

      <Menu.Content
        className={cn(
          "absolute bottom-full right-0 z-50 mb-2 max-h-56 w-36 overflow-y-auto",
          "origin-bottom-right rounded-xl border border-white/10 bg-[#101114]/95 p-1 shadow-2xl backdrop-blur-xl",
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
  const [centerFlash, setCenterFlash] = useState<"play" | "pause" | null>(null)
  const centerFlashTimeout = useRef<ReturnType<typeof setTimeout>>(null)

  const leftTimeout = useRef<ReturnType<typeof setTimeout>>(null)
  const rightTimeout = useRef<ReturnType<typeof setTimeout>>(null)

  const playerRef = useRef<MediaPlayerInstance>(null)
  const remote = useMediaRemote(playerRef)
  const volume = useMediaState("volume", playerRef)
  const currentTime = useMediaState("currentTime", playerRef)
  const duration = useMediaState("duration", playerRef)
  const paused = useMediaState("paused", playerRef)
  const isBuffering = useMediaState("waiting", playerRef)
  const canPlay = useMediaState("canPlay", playerRef)
  const error = useMediaState("error", playerRef)
  const lastSentRef = useRef(0)
  const viewRecordedRef = useRef(false)

  const queryClient = useQueryClient()

  const handleVolumeWheel = (e: React.WheelEvent) => {
    e.preventDefault()
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
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["video-details"] }),
  })

  const differenceInTimeToSend =
    duration < 60 ? Math.trunc(duration * 0.4) : Math.trunc(duration * 0.1)
  console.log(duration)
  console.log(differenceInTimeToSend, "differenceInTimeToSend")

  useEffect(() => {
    if (
      currentTime - lastSentRef.current >= differenceInTimeToSend ||
      currentTime === 0 ||
      currentTime === duration
    ) {
      lastSentRef.current = currentTime
      mutateTrack({ videoId, watchedSeconds: Math.floor(currentTime) })
    }
    if (currentTime > 5 && !viewRecordedRef.current) {
      viewRecordedRef.current = true
      recordView(videoId)
    }
  }, [currentTime, videoId, mutateTrack, duration, recordView])

  const flashCenterIcon = (nextPaused: boolean) => {
    setCenterFlash(nextPaused ? "pause" : "play")
    clearTimeout(centerFlashTimeout.current ?? undefined)
    centerFlashTimeout.current = setTimeout(() => setCenterFlash(null), 450)
  }

  return (
    <MediaPlayer
      ref={playerRef}
      title={title}
      src={src}
      storage={`stream-pro-player:${videoId}`}
      className="relative aspect-video w-full select-none overflow-hidden rounded-xl bg-black"
    >
      <div className="absolute inset-0 overflow-hidden bg-black">
        <MediaProvider />
      </div>

      <Controls.Root className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center bg-gradient-to-b from-black/65 to-transparent px-5 pb-8 pt-4 opacity-0 transition-opacity duration-300 media-controls:opacity-100">
        <h2 className="truncate text-[13px] font-medium tracking-wide text-white/85 sm:text-sm">
          {title}
        </h2>
      </Controls.Root>

      {!error && (isBuffering || !canPlay) && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-[#f2a93c]" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/85 px-4 text-center backdrop-blur-sm">
          <AlertTriangle
            className="h-8 w-8 text-[#f2a93c]"
            strokeWidth={1.75}
          />
          <p className="text-[13px] text-white/70">
            حصلت مشكلة في تحميل الفيديو
          </p>
          <button
            onClick={() => playerRef.current?.startLoading()}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] text-white/90 transition-colors hover:border-[#f2a93c]/50 hover:bg-[#f2a93c]/10 hover:text-[#f2a93c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2a93c]/70"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة المحاولة
          </button>
        </div>
      )}

      <Gesture
        className="absolute inset-0 z-0"
        event="pointerup"
        action="toggle:paused"
        onWillTrigger={() => flashCenterIcon(!paused)}
      />
      <Gesture
        className="absolute inset-0 z-0"
        event="dblpointerup"
        action="toggle:fullscreen"
      />

      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-4 backdrop-blur-md transition-all duration-300 ease-out",
          centerFlash ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
      >
        {centerFlash === "pause" ? (
          <PauseIcon className="h-8 w-8 text-white" />
        ) : (
          <PlayIcon className="h-8 w-8 text-[#f2a93c]" />
        )}
      </div>

      <Gesture
        className="absolute left-0 top-0 z-10 h-full w-1/3 transition-all duration-300"
        style={{
          backgroundColor: edgeZoneTriggered.left
            ? "rgba(255, 255, 255, 0.15)"
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
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 p-2 rounded-full rotate-180 transition-all duration-300",
            edgeZoneTriggered.left
              ? "text-white opacity-100 scale-100"
              : "text-transparent opacity-0 scale-75"
          )}
        />
      </Gesture>

      <Gesture
        className="absolute right-0 top-0 z-10 h-full w-1/3 transition-all duration-300"
        style={{
          backgroundColor: edgeZoneTriggered.right
            ? "rgba(255, 255, 255, 0.15)"
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
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 p-2 rounded-full transition-all duration-300",
            edgeZoneTriggered.right
              ? "text-white opacity-100 scale-100"
              : "text-transparent opacity-0 scale-75"
          )}
        />
      </Gesture>

      <Controls.Root
        hideDelay={1500}
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 to-transparent px-5 pb-4 pt-12 opacity-0 transition-opacity duration-300 media-controls:opacity-100"
      >
        <Controls.Group className="pointer-events-auto mb-2.5 flex w-full items-center">
          <TimeSlider.Root
            aria-label="Seek"
            className="group/slider relative flex h-5 w-full cursor-pointer items-center touch-none select-none"
          >
            <TimeSlider.Track className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/20 transition-all group-hover/slider:h-1">
              <TimeSlider.Progress className="absolute z-10 h-full w-(--slider-progress) rounded-full bg-white/35" />
              <TimeSlider.TrackFill
                className="pointer-events-none absolute left-0 top-0 z-20 h-full rounded-full bg-[#f2a93c]"
                style={{ width: SLIDER_FILL }}
              />
            </TimeSlider.Track>

            <TimeSlider.Thumb
              className="pointer-events-none absolute top-1/2 z-30 h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-[#f2a93c] shadow-[0_0_0_4px_rgba(242,169,60,0.25)] transition-transform group-hover/slider:scale-100"
              style={{ left: SLIDER_FILL }}
            />

            <TimeSlider.Preview className="pointer-events-none flex -translate-y-1 flex-col items-center opacity-0 transition-all duration-150 data-[visible]:translate-y-0 data-[visible]:opacity-100">
              <TimeSlider.Value className="rounded-md border border-white/10 bg-[#101114]/95 px-2 py-1 text-[11px] font-medium tabular-nums text-white shadow-lg" />
            </TimeSlider.Preview>
          </TimeSlider.Root>
        </Controls.Group>

        <Controls.Group className="pointer-events-auto flex w-full items-center justify-between text-white">
          <div className={GLASS_PILL}>
            <PlayButton className={PLAY_BTN}>
              <PlayIcon className="h-5 w-5 block media-playing:hidden" />
              <PauseIcon className="h-5 w-5 hidden media-playing:block" />
              <ReplayIcon className="h-5 w-5 hidden media-ended:block" />
            </PlayButton>

            <div
              className="group/volume relative flex items-center shrink-0"
              onWheel={handleVolumeWheel}
            >
              <MuteButton className={ICON_BTN}>
                <VolumeHighIcon className="h-[18px] w-[18px] block media-muted:hidden media-volume-low:hidden" />
                <VolumeLowIcon className="h-[18px] w-[18px] hidden media-volume-low:block" />
                <MuteIcon className="h-[18px] w-[18px] hidden media-muted:block text-white/60" />
              </MuteButton>

              <div className="invisible absolute bottom-full left-1/2 z-50 -translate-x-1/2 pb-3 opacity-0 transition-all duration-200 group-hover/volume:visible group-hover/volume:opacity-100 group-focus-within/volume:visible group-focus-within/volume:opacity-100">
                <div className="h-24 w-9 rounded-full border border-white/10 bg-[#101114]/95 p-2.5 shadow-2xl backdrop-blur-xl">
                  <VolumeSlider.Root
                    aria-label="Volume"
                    orientation="vertical"
                    className="relative flex h-full cursor-pointer touch-none select-none justify-center"
                  >
                    <VolumeSlider.Track className="relative h-full w-1 overflow-hidden rounded-full bg-white/15">
                      <VolumeSlider.TrackFill
                        className="pointer-events-none absolute bottom-0 left-0 w-full rounded-full bg-white/80"
                        style={{ height: SLIDER_FILL }}
                      />
                    </VolumeSlider.Track>
                    <VolumeSlider.Thumb
                      className="pointer-events-none absolute left-1/2 z-10 h-2.5 w-2.5 rounded-full bg-white shadow"
                      style={{
                        bottom: SLIDER_FILL,
                        transform: "translate(-50%, 50%)",
                      }}
                    />
                  </VolumeSlider.Root>
                </div>
              </div>
            </div>

            <div className={GROUP_DIVIDER} />

            <button
              onClick={() => setIsRemainder(!isRemainder)}
              className="flex items-center gap-1 rounded-full px-2 text-[13px] font-medium tabular-nums text-white/85 transition-colors hover:text-white"
            >
              <Time type="current" remainder={isRemainder} />
              <span className="text-white/35">/</span>
              <Time type="duration" className="text-white/50" />
            </button>
          </div>

          <div className={GLASS_PILL}>
            <CaptionButton className={ICON_BTN}>
              <ClosedCaptionsIcon className="h-[18px] w-[18px] block media-captions:hidden" />
              <ClosedCaptionsOnIcon className="h-[18px] w-[18px] hidden media-captions:block text-[#f2a93c]" />
            </CaptionButton>

            <SpeedMenu />
            <QualityMenu />

            <div className={cn(GROUP_DIVIDER, "hidden sm:block")} />

            <PIPButton className={cn(ICON_BTN, "hidden sm:flex")}>
              <PictureInPictureIcon className="h-[18px] w-[18px] block media-pip:hidden" />
              <PictureInPictureExitIcon className="h-[18px] w-[18px] hidden media-pip:block text-[#f2a93c]" />
            </PIPButton>

            <FullscreenButton className={ICON_BTN}>
              <FullscreenIcon className="h-[18px] w-[18px] block media-fullscreen:hidden" />
              <FullscreenExitIcon className="h-[18px] w-[18px] hidden media-fullscreen:block text-[#f2a93c]" />
            </FullscreenButton>
          </div>
        </Controls.Group>
      </Controls.Root>
    </MediaPlayer>
  )
}
