import { Camera, CameraOff, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MediaPreferencesProps {
  camera: boolean
  mic: boolean
  onCameraChange: (val: boolean) => void
  onMicChange: (val: boolean) => void
}

export const MediaPreferences = ({
  camera,
  mic,
  onCameraChange,
  onMicChange,
}: MediaPreferencesProps) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">Pre-join settings</div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={mic ? "outline" : "secondary"}
          onClick={() => onMicChange(!mic)}
          className="gap-1.5 text-xs"
        >
          {mic ? <Mic className="size-3.5 text-emerald-500" /> : <MicOff className="size-3.5 text-muted-foreground" />}
          <span>{mic ? "Mic on" : "Mic off"}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={camera ? "outline" : "secondary"}
          onClick={() => onCameraChange(!camera)}
          className="gap-1.5 text-xs"
        >
          {camera ? <Camera className="size-3.5 text-emerald-500" /> : <CameraOff className="size-3.5 text-muted-foreground" />}
          <span>{camera ? "Cam on" : "Cam off"}</span>
        </Button>
      </div>
    </div>
  )
}
