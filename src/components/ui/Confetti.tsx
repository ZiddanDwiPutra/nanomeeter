import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  color: string
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

const COLORS = [
  "#10b981", // emerald
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#ef4444", // red
  "#eab308", // yellow
]

export const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    const particles: Particle[] = []
    const particleCount = 120

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Initialize particles originating from top half
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height * 0.5,
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
      })
    }

    const startTime = Date.now()
    const duration = 5000 // 5 seconds

    const render = () => {
      const elapsed = Date.now() - startTime
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let alive = false

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 // gravity
        p.rotation += p.rotationSpeed

        // Fade out in last 1.5s
        if (elapsed > duration - 1500) {
          p.opacity = Math.max(0, (duration - elapsed) / 1500)
        }

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          alive = true
          ctx.save()
          ctx.globalAlpha = p.opacity
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotation * Math.PI) / 180)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          ctx.restore()
        }
      }

      if (alive && elapsed < duration) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      aria-hidden="true"
    />
  )
}
