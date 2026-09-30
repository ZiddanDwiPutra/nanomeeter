import { useEffect, useState } from "react"

export type Route =
  | { name: "home" }
  | { name: "join"; roomId: string }
  | { name: "room"; roomId: string }

function parse(): Route {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean)
  if (parts[0] === "join" && parts[1]) return { name: "join", roomId: parts[1] }
  if (parts[0] === "room" && parts[1]) return { name: "room", roomId: parts[1] }
  return { name: "home" }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return route
}

export function navigate(to: string) {
  location.hash = to
}
