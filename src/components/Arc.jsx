// The Arc: a 30-day dawn-to-dusk dial.
// Each day is a point along a half-circle arc, positioned by recency and
// sized/colored by a computed "load" score (0-4) from that day's symptoms.

function loadScore(log) {
  if (!log) return null
  const hf = Math.min(log.hot_flashes || 0, 4) / 4
  const sweat = log.night_sweats ? 1 : 0
  const sleep = log.sleep_quality ? (5 - log.sleep_quality) / 4 : 0
  const mood = log.mood ? (5 - log.mood) / 4 : 0
  const fog = log.brain_fog ? (log.brain_fog - 1) / 4 : 0
  const joints = log.joint_aches ? (log.joint_aches - 1) / 4 : 0
  return (hf + sweat + sleep + mood + fog + joints) / 6
}

function colorForLoad(load) {
  if (load === null) return '#3A3F58'
  // interpolate dawn (soft) -> dusk (deep coral) as load rises
  const soft = [232, 146, 124] // dawn
  const deep = [185, 90, 70]   // intense
  const t = load
  const r = Math.round(soft[0] + (deep[0] - soft[0]) * t)
  const g = Math.round(soft[1] + (deep[1] - soft[1]) * t)
  const b = Math.round(soft[2] + (deep[2] - soft[2]) * t)
  return `rgb(${r},${g},${b})`
}

export default function Arc({ logsByDate, days = 30 }) {
  const width = 640
  const height = 340
  const cx = width / 2
  const cy = height - 30
  const radius = 260

  const today = new Date()
  const points = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    points.push({ date: key, log: logsByDate[key] || null })
  }

  const angleStart = Math.PI // left (oldest, "dawn")
  const angleEnd = 0 // right (today, "dusk")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: 640 }}>
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="rgba(237,233,227,0.12)"
        strokeWidth="1"
      />
      {points.map((p, i) => {
        const t = points.length === 1 ? 0.5 : i / (points.length - 1)
        const angle = angleStart + (angleEnd - angleStart) * t
        const x = cx + radius * Math.cos(angle)
        const y = cy - radius * Math.sin(angle) * 0.62
        const load = loadScore(p.log)
        const r = p.log ? 5 + load * 7 : 3
        const fill = colorForLoad(load)
        return (
          <circle key={p.date} cx={x} cy={y} r={r} fill={fill} opacity={p.log ? 0.95 : 0.35}>
            <title>{p.date}{load !== null ? ` — load ${(load * 100).toFixed(0)}%` : ' — no entry'}</title>
          </circle>
        )
      })}
      <text x={cx - radius} y={cy + 22} fill="#9CA0B8" fontSize="12" fontFamily="Inter, sans-serif">
        30 days ago
      </text>
      <text x={cx + radius} y={cy + 22} fill="#9CA0B8" fontSize="12" textAnchor="end" fontFamily="Inter, sans-serif">
        today
      </text>
    </svg>
  )
}
