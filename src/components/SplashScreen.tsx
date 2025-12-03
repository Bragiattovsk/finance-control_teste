import { useEffect, useState } from "react"

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let t2: number | undefined
    const t1 = window.setTimeout(() => {
      setIsVisible(false)
      t2 = window.setTimeout(() => {
        onFinish()
      }, 700)
    }, 2000)

    return () => {
      clearTimeout(t1)
      if (t2 !== undefined) clearTimeout(t2)
    }
  }, [onFinish])

  const containerClass = `fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-700 ease-in-out ${
    isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
  }`

  return (
    <div className={containerClass}>
      <div className="text-5xl md:text-7xl font-black tracking-tighter text-white animate-in zoom-in-95 fade-in duration-1000">
        NEXO
      </div>
      <div className="text-xs md:text-sm font-light text-zinc-500 tracking-[0.3em] mt-4 uppercase animate-in slide-in-from-bottom-2 fade-in duration-1000 delay-200">
        FINANCE CONTROL
      </div>
    </div>
  )
}

