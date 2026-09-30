import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { newRoomId, sha256 } from "@/lib/crypto"
import { navigate } from "@/lib/router"
import { setSession } from "@/lib/session"

const Home = () => {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !password) {
      toast.error("Name and password are required")
      return
    }
    const roomId = newRoomId()
    setSession({
      roomId,
      name: name.trim(),
      passwordHash: await sha256(password),
      isHost: true,
    })
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">nanomeeter</CardTitle>
          <CardDescription>
            Peer-to-peer video meetings. No accounts, nothing stored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Meeting password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Share it with your invitees"
              />
            </div>
            <Button type="submit" className="w-full">
              Create meeting
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Home
