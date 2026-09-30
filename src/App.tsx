import { Toaster } from "@/components/ui/sonner"
import Home from "@/pages/Home"
import Join from "@/pages/Join"
import Room from "@/pages/Room"
import { useRoute } from "@/lib/router"

const App = () => {
  const route = useRoute()

  return (
    <>
      {route.name === "home" && <Home />}
      {route.name === "join" && <Join roomId={route.roomId} />}
      {route.name === "room" && <Room roomId={route.roomId} />}
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
