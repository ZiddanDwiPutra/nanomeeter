export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function newRoomId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 12)
}

export function joinLink(roomId: string): string {
  return `${location.origin}${location.pathname}#/join/${roomId}`
}
