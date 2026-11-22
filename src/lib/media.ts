export const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
}

export const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
}

export interface AcquireMediaOptions {
  wantAudio?: boolean
  wantVideo?: boolean
}

export interface AcquireMediaResult {
  stream: MediaStream
  hasAudio: boolean
  hasVideo: boolean
  warnings: string[]
}

export const acquireUserMedia = async ({
  wantAudio = true,
  wantVideo = true,
}: AcquireMediaOptions): Promise<AcquireMediaResult> => {
  const warnings: string[] = []

  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      stream: new MediaStream(),
      hasAudio: false,
      hasVideo: false,
      warnings: ["Media devices are not supported in this browser."],
    }
  }

  if (!wantAudio && !wantVideo) {
    return {
      stream: new MediaStream(),
      hasAudio: false,
      hasVideo: false,
      warnings: [],
    }
  }

  // If both requested, attempt both first
  if (wantAudio && wantVideo) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: DEFAULT_VIDEO_CONSTRAINTS,
        audio: DEFAULT_AUDIO_CONSTRAINTS,
      })
      return { stream, hasAudio: true, hasVideo: true, warnings }
    } catch {
      // Fallback: try individual media sources
    }
  }

  let audioTrack: MediaStreamTrack | null = null
  let videoTrack: MediaStreamTrack | null = null

  if (wantAudio) {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: DEFAULT_AUDIO_CONSTRAINTS,
      })
      audioTrack = audioStream.getAudioTracks()[0] ?? null
    } catch {
      warnings.push("Microphone unavailable or permission denied.")
    }
  }

  if (wantVideo) {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: DEFAULT_VIDEO_CONSTRAINTS,
      })
      videoTrack = videoStream.getVideoTracks()[0] ?? null
    } catch {
      warnings.push("Camera unavailable or permission denied.")
    }
  }

  const stream = new MediaStream()
  if (audioTrack) stream.addTrack(audioTrack)
  if (videoTrack) stream.addTrack(videoTrack)

  return {
    stream,
    hasAudio: !!audioTrack,
    hasVideo: !!videoTrack,
    warnings,
  }
}

export const requestMediaTrack = async (
  kind: "audio" | "video",
): Promise<MediaStreamTrack | null> => {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null
  }

  const stream = await navigator.mediaDevices.getUserMedia(
    kind === "audio"
      ? { audio: DEFAULT_AUDIO_CONSTRAINTS }
      : { video: DEFAULT_VIDEO_CONSTRAINTS },
  )

  const tracks = kind === "audio" ? stream.getAudioTracks() : stream.getVideoTracks()
  return tracks[0] ?? null
}
