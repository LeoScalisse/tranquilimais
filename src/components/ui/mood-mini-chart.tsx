"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { MoodEntry } from "@/types"

interface MoodMiniChartProps {
  moodHistory: MoodEntry[]
  onMoodClick?: (mood: MoodEntry) => void
}

const EMOTION_LABELS: Record<string, string> = {
  calmo: "Calmo",
  ansioso: "Ansioso",
  triste: "Triste",
  cansado: "Cansado",
  sobrecarregado: "Sobrecarregado",
  grato: "Grato",
  motivado: "Motivado",
  confuso: "Confuso",
  esperancoso: "Esperançoso",
  vazio: "Vazio",
}

const EMOTION_COLORS: Record<string, string> = {
  calmo: "from-emerald-400 to-emerald-600",
  ansioso: "from-amber-400 to-amber-600",
  triste: "from-blue-400 to-blue-600",
  cansado: "from-slate-400 to-slate-600",
  sobrecarregado: "from-red-400 to-red-600",
  grato: "from-pink-400 to-pink-600",
  motivado: "from-orange-400 to-orange-600",
  confuso: "from-purple-400 to-purple-600",
  esperancoso: "from-cyan-400 to-cyan-600",
  vazio: "from-gray-400 to-gray-600",
}

const INTENSITY_VALUES: Record<string, number> = {
  leve: 33,
  moderado: 66,
  intenso: 100,
}

const INTENSITY_LABELS: Record<string, string> = {
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
}

// Fallback mood values for legacy data
const LEGACY_MOOD_VALUES: Record<string, number> = {
  happy: 100,
  calm: 80,
  neutral: 60,
  sad: 40,
  anxious: 20,
}

export function MoodMiniChart({ moodHistory, onMoodClick }: MoodMiniChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [displayData, setDisplayData] = useState<{ emotion: string; intensity: string } | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get last 7 entries
  const last7 = moodHistory.slice(-7)

  useEffect(() => {
    if (hoveredIndex !== null && last7[hoveredIndex]) {
      const entry = last7[hoveredIndex]
      if (entry.checkin_data?.emotions?.length) {
        setDisplayData({
          emotion: entry.checkin_data.emotions.map(e => EMOTION_LABELS[e] || e).join(", "),
          intensity: entry.checkin_data.intensity ? INTENSITY_LABELS[entry.checkin_data.intensity] : "",
        })
      } else {
        setDisplayData({
          emotion: entry.mood,
          intensity: "",
        })
      }
    }
  }, [hoveredIndex, last7])

  const handleContainerEnter = () => setIsHovering(true)
  const handleContainerLeave = () => {
    setIsHovering(false)
    setHoveredIndex(null)
    setTimeout(() => {
      setDisplayData(null)
    }, 150)
  }

  const getBarHeight = (entry: MoodEntry): number => {
    if (entry.checkin_data?.intensity) {
      return INTENSITY_VALUES[entry.checkin_data.intensity] || 50
    }
    // Fallback for legacy data
    return LEGACY_MOOD_VALUES[entry.mood] || 50
  }

  const getBarColor = (entry: MoodEntry): string => {
    if (entry.checkin_data?.emotions?.length) {
      return EMOTION_COLORS[entry.checkin_data.emotions[0]] || "from-primary to-primary/80"
    }
    // Fallback for legacy moods
    const legacyColors: Record<string, string> = {
      happy: "from-yellow-400 to-yellow-600",
      calm: "from-emerald-400 to-emerald-600",
      neutral: "from-slate-400 to-slate-600",
      sad: "from-blue-400 to-blue-600",
      anxious: "from-amber-400 to-amber-600",
    }
    return legacyColors[entry.mood] || "from-primary to-primary/80"
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0).toUpperCase()
  }

  if (last7.length === 0) {
    return (
      <div className="relative w-full max-w-sm mx-auto p-5 bg-card rounded-2xl border border-border shadow-lg">
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p className="text-sm">Registre seu humor para ver o gráfico</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
      className="relative w-full max-w-sm mx-auto p-5 bg-card rounded-2xl border border-border shadow-lg transition-all duration-300 hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/60 animate-pulse" />
          <span className="text-sm font-semibold text-foreground tracking-tight">
            Últimos 7 dias
          </span>
        </div>

        <div className="flex items-baseline gap-0.5">
          <span
            className={cn(
              "text-lg font-bold text-foreground transition-all duration-300",
              displayData ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            )}
          >
            {displayData?.emotion || ""}
          </span>
          {displayData?.intensity && (
            <span className="text-xs text-muted-foreground font-medium ml-1">
              ({displayData.intensity})
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between gap-2 h-28 px-1">
        {last7.map((entry, index) => {
          const heightPercent = getBarHeight(entry)
          const isHovered = hoveredIndex === index
          const isAnyHovered = hoveredIndex !== null
          const isNeighbor = hoveredIndex !== null && (index === hoveredIndex - 1 || index === hoveredIndex + 1)
          const barColor = getBarColor(entry)

          return (
            <div
              key={entry.id || index}
              className="flex flex-col items-center gap-2 flex-1 cursor-pointer group"
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={() => onMoodClick?.(entry)}
            >
              {/* Bar */}
              <div
                className={cn(
                  "w-full rounded-lg bg-gradient-to-t transition-all duration-300 ease-out relative overflow-hidden",
                  barColor,
                  isHovered && "scale-110 shadow-lg",
                  isNeighbor && "scale-105 opacity-80",
                  isAnyHovered && !isHovered && !isNeighbor && "opacity-40 scale-95"
                )}
                style={{
                  height: `${heightPercent}%`,
                  minHeight: "20px",
                }}
              >
                {/* Shimmer effect on hover */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-opacity duration-300",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    transform: "skewX(-20deg)",
                  }}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isHovered ? "text-foreground scale-110" : "text-muted-foreground"
                )}
              >
                {formatDate(entry.date)}
              </span>

              {/* Tooltip */}
              <div
                className={cn(
                  "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs font-medium rounded-md shadow-lg transition-all duration-200 whitespace-nowrap border border-border",
                  isHovered
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-2 scale-95 pointer-events-none"
                )}
              >
                {entry.checkin_data?.emotions?.length
                  ? entry.checkin_data.emotions.map(e => EMOTION_LABELS[e] || e).join(", ")
                  : entry.mood}
              </div>
            </div>
          )
        })}
      </div>

      {/* Subtle glow effect on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent transition-opacity duration-300 pointer-events-none",
          isHovering ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}
