import { HoneycombBackground } from "@/components/common/HoneycombBackground"
import { Toaster } from "@/components/ui/sonner"
import Home from "@/pages/Home"
import Join from "@/pages/Join"
import Room from "@/pages/Room"
import { useRoute } from "@/lib/router"

const App = () => {
  const route = useRoute()

  return (
    <div className="relative min-h-svh bg-background text-foreground selection:bg-cyan-500/30">
      <HoneycombBackground />
      {route.name === "home" && <Home />}
      {route.name === "join" && <Join roomId={route.roomId} />}
      {route.name === "room" && <Room roomId={route.roomId} />}
      <Toaster position="top-center" richColors />
    </div>
  )
}

export default App
