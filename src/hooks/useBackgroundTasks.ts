import { useEffect, useRef } from "react"
import { useStore } from "@/store"

export function useBackgroundTasks() {
  const processTimeouts = useStore((s) => s.processTimeouts)
  const processWaitlistNotifications = useStore((s) => s.processWaitlistNotifications)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    processTimeouts()
    processWaitlistNotifications()

    intervalRef.current = window.setInterval(() => {
      processTimeouts()
      processWaitlistNotifications()
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [processTimeouts, processWaitlistNotifications])
}
