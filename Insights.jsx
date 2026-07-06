// Free, rule-based pattern engine. No paid API required.

function avg(arr) {
  const vals = arr.filter((v) => v !== null && v !== undefined)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function computeInsights(logs) {
  const insights = []
  if (logs.length < 5) {
    return [{ glyph: '🌅', text: 'Log at least 5 days to start seeing patterns here.' }]
  }

  const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date))
  const last14 = sorted.slice(-14)
  const prev14 = sorted.slice(-28, -14)

  // Trend: hot flash frequency
  const recentHF = avg(last14.map((l) => l.hot_flashes))
  const priorHF = avg(prev14.map((l) => l.hot_flashes))
  if (recentHF !== null && priorHF !== null && prev14.length >= 5) {
    const delta = recentHF - priorHF
    if (Math.abs(delta) >= 0.5) {
      insights.push({
        glyph: delta > 0 ? '📈' : '📉',
        text: `Hot flashes are averaging ${recentHF.toFixed(1)}/day over the last two weeks, ${
          delta > 0 ? 'up' : 'down'
        } from ${priorHF.toFixed(1)}/day the two weeks before.`,
      })
    }
  }

  // Hot-flash night -> next day sleep quality correlation
  const withNext = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const day = sorted[i]
    const next = sorted[i + 1]
    const gap = (new Date(next.log_date) - new Date(day.log_date)) / 86400000
    if (gap === 1 && next.sleep_quality != null) {
      withNext.push({ hf: day.hot_flashes || 0, sweats: day.night_sweats, nextSleep: next.sleep_quality })
    }
  }
  if (withNext.length >= 6) {
    const heavyNights = withNext.filter((d) => d.hf >= 2 || d.sweats)
    const lightNights = withNext.filter((d) => d.hf < 2 && !d.sweats)
    const heavySleep = avg(heavyNights.map((d) => d.nextSleep))
    const lightSleep = avg(lightNights.map((d) => d.nextSleep))
    if (heavySleep !== null && lightSleep !== null && heavyNights.length >= 3 && lightNights.length >= 3) {
      const diff = lightSleep - heavySleep
      if (diff >= 0.6) {
        insights.push({
          glyph: '🌙',
          text: `Sleep quality tends to drop after heavier hot-flash nights — averaging ${heavySleep.toFixed(
            1
          )}/5 the next day, versus ${lightSleep.toFixed(1)}/5 after calmer nights.`,
        })
      }
    }
  }

  // Brain fog vs sleep quality (same day)
  const withBoth = sorted.filter((l) => l.brain_fog != null && l.sleep_quality != null)
  if (withBoth.length >= 8) {
    const lowSleepDays = withBoth.filter((l) => l.sleep_quality <= 2)
    const highSleepDays = withBoth.filter((l) => l.sleep_quality >= 4)
    const fogLow = avg(lowSleepDays.map((l) => l.brain_fog))
    const fogHigh = avg(highSleepDays.map((l) => l.brain_fog))
    if (fogLow !== null && fogHigh !== null && lowSleepDays.length >= 3 && highSleepDays.length >= 3) {
      const diff = fogLow - fogHigh
      if (diff >= 0.6) {
        insights.push({
          glyph: '🌫️',
          text: `Brain fog runs higher on poor-sleep days (${fogLow.toFixed(1)}/5) compared with well-rested days (${fogHigh.toFixed(
            1
          )}/5).`,
        })
      }
    }
  }

  // Cycle status vs symptom load
  const heavyCycleDays = sorted.filter((l) => l.cycle_status === 'heavy')
  if (heavyCycleDays.length >= 3) {
    const moodOnHeavy = avg(heavyCycleDays.map((l) => l.mood))
    const moodOverall = avg(sorted.map((l) => l.mood))
    if (moodOnHeavy !== null && moodOverall !== null && moodOverall - moodOnHeavy >= 0.5) {
      insights.push({
        glyph: '🩸',
        text: `Mood tends to dip on heavy-cycle days (${moodOnHeavy.toFixed(1)}/5) compared with your overall average (${moodOverall.toFixed(
          1
        )}/5).`,
      })
    }
  }

  // Streak encouragement
  const last7 = sorted.slice(-7)
  if (last7.length === 7) {
    insights.push({ glyph: '✦', text: "You've logged every day for a week straight — patterns get clearer the longer this runs." })
  }

  if (!insights.length) {
    insights.push({ glyph: '🌤️', text: 'Nothing stands out yet — that itself can be a good sign of steadiness.' })
  }

  return insights
}

export default function Insights({ logs }) {
  const insights = computeInsights(logs)
  return (
    <div className="card">
      <h2>Patterns</h2>
      <p className="sub">Computed directly from your logs — no external service involved.</p>
      <div className="insight-list">
        {insights.map((ins, i) => (
          <div className="insight-item" key={i}>
            <span className="glyph">{ins.glyph}</span>
            <p>{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
