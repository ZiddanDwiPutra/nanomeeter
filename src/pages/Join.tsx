import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sha256 } from "@/lib/crypto"
import { navigate } from "@/lib/router"
import { setSession } from "@/lib/session"

const Join = ({ roomId }: { roomId: string }) => {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !password) {
      toast.error("Name and password are required")
      return
    }
    setSession({
      roomId,
      name: name.trim(),
      passwordHash: await sha256(password),
      isHost: false,
    })
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">Join meeting</CardTitle>
          <CardDescription>
            Room <span className="font-mono">{roomId}</span>
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
                placeholder="Ask the host"
              />
            </div>
            <Button type="submit" className="w-full">
              Join
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Join
