import { useEffect, useRef, useState } from 'react'

interface UseSubmitCtaStateOptions {
  successDurationMs?: number
}

export function useSubmitCtaState(
  isSaving: boolean,
  options?: UseSubmitCtaStateOptions
) {
  const duration = options?.successDurationMs ?? 350
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (isSaving) setIsSaved(false)
  }, [isSaving])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function markSaved() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsSaved(true)
    timerRef.current = setTimeout(() => setIsSaved(false), duration)
  }

  return { isSaved, markSaved }
}
