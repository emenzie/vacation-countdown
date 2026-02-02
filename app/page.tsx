"use client"

import { useState, useEffect, useRef } from "react"

export default function KeysCountdown() {
  const TRIP_DATE = "2026-02-15T00:00:00"

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const target = new Date(TRIP_DATE).getTime()
      const difference = target - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const playOceanSound = async () => {
    if (isPlaying) {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop()
          sourceRef.current.disconnect()
        } catch (e) {
          console.log("Error stopping source:", e)
        }
        sourceRef.current = null
      }
      if (gainRef.current) {
        gainRef.current.disconnect()
        gainRef.current = null
      }
      setIsPlaying(false)
      return
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }

      const audioContext = audioContextRef.current

      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      const bufferSize = audioContext.sampleRate * 5
      const buffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate)
      const dataL = buffer.getChannelData(0)
      const dataR = buffer.getChannelData(1)

      for (let i = 0; i < bufferSize; i++) {
        const time = i / audioContext.sampleRate
        const wave1 = Math.sin(time * Math.PI * 0.5) * 0.4
        const wave2 = Math.sin(time * Math.PI * 0.25) * 0.3
        const noise = Math.random() * 2 - 1
        const amplitude = 0.4 + wave1 * 0.3 + wave2 * 0.2

        dataL[i] = noise * amplitude
        dataR[i] = (Math.random() * 2 - 1) * amplitude
      }

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.loop = true

      const filter = audioContext.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = 1200
      filter.Q.value = 0.5

      const filter2 = audioContext.createBiquadFilter()
      filter2.type = "lowpass"
      filter2.frequency.value = 600
      filter2.Q.value = 1

      const gainNode = audioContext.createGain()
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.5)

      source.connect(filter)
      filter.connect(filter2)
      filter2.connect(gainNode)
      gainNode.connect(audioContext.destination)

      sourceRef.current = source
      gainRef.current = gainNode

      source.start(0)

      setIsPlaying(true)
    } catch (error) {
      console.error("Error playing ocean sound:", error)
      setIsPlaying(false)
    }
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          border: "3px solid #ff6b9d",
          boxShadow: "4px 4px 0 #20b2aa, 8px 8px 20px rgba(0,0,0,0.15)",
          fontFamily: '"Courier New", monospace',
        }}
        className="text-5xl md:text-7xl font-bold px-4 md:px-6 py-3 md:py-4 rounded-lg min-w-[80px] md:min-w-[120px] text-center"
      >
        <span style={{ color: "#ff6b9d" }}>{String(value).padStart(2, "0")}</span>
      </div>
      <span
        style={{
          color: "#ffffff",
          fontFamily: 'Chicago, "Courier New", monospace',
          textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
        }}
        className="text-sm md:text-base mt-2 uppercase tracking-widest font-bold"
      >
        {label}
      </span>
    </div>
  )

  return (
    <div
      onClick={playOceanSound}
      style={{
        background: "linear-gradient(180deg, #87CEEB 0%, #FFB347 25%, #ff9a8b 50%, #ff6b9d 75%, #c44569 100%)",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "filter 0.3s ease",
      }}
      className="p-4"
    >
      {/* Sun */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "120px",
          height: "120px",
          background: "radial-gradient(circle, #fff7ae 0%, #ffd700 50%, #ffb347 100%)",
          borderRadius: "50%",
          boxShadow: "0 0 60px #ffd700, 0 0 100px #ffb347",
          zIndex: 5,
        }}
      />

      {/* Sound indicator */}
      {isPlaying && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(32, 178, 170, 0.95)",
            color: "white",
            padding: "12px 20px",
            borderRadius: "25px",
            fontFamily: '"Courier New", monospace',
            fontSize: "13px",
            fontWeight: "bold",
            border: "2px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 100,
            animation: "fadeIn 0.3s ease, pulse 2s ease-in-out infinite",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🌊</span>
            OCEAN SOUNDS ON
          </div>
          <div style={{ fontSize: "10px", opacity: 0.9, letterSpacing: "1px" }}>TAP TO STOP</div>
        </div>
      )}

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: "rgba(255, 107, 157, 0.95)",
          color: "white",
          padding: "12px 16px",
          borderRadius: "50%",
          fontFamily: '"Courier New", monospace',
          fontSize: "20px",
          fontWeight: "bold",
          border: "3px solid white",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          zIndex: 100,
          transition: "transform 0.2s ease, background 0.2s ease",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.transform = "scale(1.1)")}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.transform = "scale(1)")}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? "⊗" : "⛶"}
      </button>

      {/* Clouds */}
      <div style={{ position: "absolute", top: "5%", left: "10%", fontSize: "3rem", opacity: 0.8 }}>☁️</div>
      <div style={{ position: "absolute", top: "12%", right: "15%", fontSize: "2.5rem", opacity: 0.7 }}>☁️</div>
      <div style={{ position: "absolute", top: "8%", left: "70%", fontSize: "2rem", opacity: 0.6 }}>☁️</div>

      {/* Palm Trees */}
      <div style={{ position: "absolute", bottom: "18%", left: "3%", fontSize: "5rem", transform: "scaleX(-1)" }}>🌴</div>
      <div style={{ position: "absolute", bottom: "20%", right: "5%", fontSize: "4.5rem" }}>🌴</div>
      <div style={{ position: "absolute", bottom: "16%", left: "15%", fontSize: "3rem", opacity: 0.7 }}>🌴</div>

      {/* Ocean */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "18%",
          background: "linear-gradient(180deg, #20b2aa 0%, #008b8b 50%, #006666 100%)",
          zIndex: 1,
        }}
      >
        {/* Wave pattern */}
        <div
          style={{
            position: "absolute",
            top: "-10px",
            left: 0,
            right: 0,
            height: "20px",
            background:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20'%3E%3Cpath d='M0 15 Q25 0 50 15 T100 15 V20 H0Z' fill='%2320b2aa'/%3E%3C/svg%3E\") repeat-x",
            backgroundSize: "100px 20px",
            animation: "wave 3s linear infinite",
          }}
        />
      </div>

      {/* Beach/Sand */}
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: 0,
          right: 0,
          height: "5%",
          background: "linear-gradient(180deg, #f4e4ba 0%, #deb887 100%)",
          zIndex: 0,
        }}
      />

      {/* Main Window */}
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          marginTop: "140px",
          border: "3px solid #20b2aa",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Window Title Bar */}
        <div
          style={{
            background: "linear-gradient(180deg, #20b2aa 0%, #008b8b 100%)",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: "2px solid #006666",
          }}
        >
          {/* Window Buttons */}
          <div style={{ display: "flex", gap: "6px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#ff6b6b",
                border: "2px solid #cc5555",
              }}
            />
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#ffd93d",
                border: "2px solid #ccad30",
              }}
            />
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#6bcb77",
                border: "2px solid #55a25f",
              }}
            />
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: 'Chicago, Monaco, "Courier New", monospace',
              fontWeight: "bold",
              fontSize: "14px",
              color: "#ffffff",
              textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
            }}
          >
            🏝️ MarathonCountdown.exe
          </div>
        </div>

        {/* Window Content */}
        <div
          style={{
            background: "linear-gradient(180deg, #fffef0 0%, #fff5e6 100%)",
            padding: "30px 20px",
            textAlign: "center",
          }}
        >
          {/* Header */}
          <div
            style={{
              fontFamily: '"Courier New", monospace',
              color: "#20b2aa",
              fontSize: "12px",
              letterSpacing: "4px",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}
          >
            ✦ Now Loading Vacation Mode ✦
          </div>

          <h1
            style={{
              fontFamily: 'Impact, "Arial Black", sans-serif',
              fontSize: "clamp(2rem, 8vw, 3.5rem)",
              color: "#ff6b9d",
              textShadow: "3px 3px 0 #20b2aa, 6px 6px 0 #ffd700",
              marginBottom: "8px",
              letterSpacing: "2px",
            }}
          >
            MARATHON, FL
          </h1>

          {/* Temperature integrated with subtitle */}
          <div
            style={{
              fontFamily: '"Courier New", monospace',
              color: "#008b8b",
              fontSize: "14px",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span>🌺</span>
            <span>DEPARTURE: FEBRUARY 15, 2026</span>
            <span>🌺</span>
          </div>

          <div
            style={{
              fontFamily: '"Courier New", monospace',
              color: "#ff6b9d",
              fontSize: "13px",
              marginBottom: "30px",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            ☀️ CURRENT TEMP: 77°F • PERFECT BEACH WEATHER
          </div>

          {/* Countdown Grid */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-8">
            <TimeBlock value={timeLeft.days} label="Days" />
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <TimeBlock value={timeLeft.minutes} label="Minutes" />
            <TimeBlock value={timeLeft.seconds} label="Seconds" />
          </div>

          {/* Progress Bar */}
          <div style={{ maxWidth: "400px", margin: "0 auto 20px" }}>
            <div
              style={{
                background: "#e8f4f4",
                border: "3px solid #20b2aa",
                borderRadius: "20px",
                padding: "4px",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  height: "20px",
                  background:
                    "repeating-linear-gradient(90deg, #ff6b9d 0px, #ff6b9d 10px, #ffd700 10px, #ffd700 20px, #20b2aa 20px, #20b2aa 30px)",
                  borderRadius: "16px",
                  width: "100%",
                  animation: "shimmer 2s linear infinite",
                }}
              />
            </div>
            <div
              style={{
                fontFamily: '"Courier New", monospace',
                color: "#20b2aa",
                fontSize: "11px",
                marginTop: "8px",
                letterSpacing: "2px",
              }}
            >
              🍹 VACATION.SYS LOADING... 🍹
            </div>
          </div>

          {/* Decorative Footer */}
          <div
            style={{
              borderTop: "2px dashed #20b2aa",
              paddingTop: "20px",
              marginTop: "10px",
            }}
          >
            <div
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: "24px",
                marginBottom: "10px",
              }}
            >
              🌊 🐚 🦀 🍹 🌅 🎣 🦈 🐠
            </div>
            <div
              style={{
                fontFamily: '"Courier New", monospace',
                color: "#ff6b9d",
                fontSize: "13px",
                letterSpacing: "2px",
                fontWeight: "bold",
              }}
            >
              MARATHON • THE HEART OF THE KEYS
            </div>
          </div>
        </div>

        {/* Window Status Bar */}
        <div
          style={{
            background: "linear-gradient(180deg, #20b2aa 0%, #008b8b 100%)",
            padding: "6px 12px",
            display: "flex",
            justifyContent: "space-between",
            fontFamily: 'Monaco, "Courier New", monospace',
            fontSize: "10px",
            color: "#ffffff",
          }}
        >
          <span>📁 C:\VACATIONS\MARATHON_2026</span>
          <span>☀️ 77°F Marathon, FL</span>
        </div>
      </div>

      {/* Bottom Tagline */}
      <div
        style={{
          textAlign: "center",
          marginTop: "30px",
          fontFamily: '"Courier New", monospace',
          color: "#ffffff",
          fontSize: "12px",
          letterSpacing: "3px",
          textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
          zIndex: 20,
          position: "relative",
        }}
      >
        {isPlaying ? "[ TAP ANYWHERE TO STOP OCEAN SOUNDS ]" : "[ TAP ANYWHERE FOR OCEAN SOUNDS ]"}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 0 0; }
          100% { background-position: 60px 0; }
        }
        @keyframes wave {
          0% { background-position-x: 0; }
          100% { background-position-x: 100px; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
