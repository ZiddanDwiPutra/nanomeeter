import { createHash, randomUUID } from 'crypto'

export function attachSignalingHandler(wss) {
  const rooms = new Map()
  const hash = (value) => createHash('sha256').update(String(value)).digest('hex')

  function send(ws, message) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message))
  }

  function broadcast(room, message, exceptId = null) {
    for (const [peerId, peer] of room.peers) {
      if (peerId !== exceptId) send(peer.ws, message)
    }
  }

  wss.on('connection', (ws) => {
    let roomId = null
    let peerId = null

    const leave = () => {
      if (!roomId || !peerId) return
      const room = rooms.get(roomId)
      if (!room) return
      room.peers.delete(peerId)
      if (room.peers.size === 0) {
        rooms.delete(roomId)
        console.log(`[room ${roomId}] closed`)
      } else {
        console.log(`[room ${roomId}] peer left (${room.peers.size} online)`)
        broadcast(room, { type: 'peer-left', peerId })
      }
    }

    ws.on('message', (raw) => {
      let msg
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }

      if (msg.type === 'create') {
        if (!msg.roomId || !msg.password || !msg.name) {
          return send(ws, { type: 'error', message: 'missing fields' })
        }
        if (rooms.has(msg.roomId)) {
          return send(ws, { type: 'error', message: 'room already exists' })
        }
        roomId = String(msg.roomId)
        peerId = randomUUID()
        rooms.set(roomId, {
          passwordHash: hash(msg.password),
          peers: new Map([[peerId, { ws, name: String(msg.name).slice(0, 40) }]]),
        })
        console.log(`[room ${roomId}] created by ${msg.name}`)
        return send(ws, { type: 'created', peerId, peers: [] })
      }

      if (msg.type === 'join') {
        if (!msg.roomId || !msg.password || !msg.name) {
          return send(ws, { type: 'error', message: 'missing fields' })
        }
        const room = rooms.get(String(msg.roomId))
        if (!room) {
          return send(ws, { type: 'error', message: 'room not found' })
        }
        if (room.passwordHash !== hash(msg.password)) {
          return send(ws, { type: 'error', message: 'wrong password' })
        }
        if (room.peers.size >= 8) {
          return send(ws, { type: 'error', message: 'room is full' })
        }
        roomId = String(msg.roomId)
        peerId = randomUUID()
        const peers = [...room.peers.entries()].map(([id, peer]) => ({ peerId: id, name: peer.name }))
        room.peers.set(peerId, { ws, name: String(msg.name).slice(0, 40) })
        broadcast(room, { type: 'peer-joined', peerId, name: String(msg.name).slice(0, 40) }, peerId)
        console.log(`[room ${roomId}] ${msg.name} joined (${room.peers.size} online)`)
        return send(ws, { type: 'joined', peerId, peers })
      }

      if (msg.type === 'signal' && roomId) {
        const room = rooms.get(roomId)
        const target = room?.peers.get(String(msg.to))
        if (target) {
          send(target.ws, { type: 'signal', from: peerId, data: msg.data })
        }
      }
    })

    ws.on('close', leave)
    ws.on('error', leave)
  })
}
