import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment"
import { useState, useEffect, useRef } from "react"
import customFields from "../config/customFields"

type WindowWithPosthog = Window & {
  posthog: {
    get_distinct_id: () => string
  }
}

const MAX_ATTEMPTS = 3

export const useCloudUrl = () => {
  const [url, setUrl] = useState(customFields.cloudUrl)
  const attempts = useRef(1)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (ExecutionEnvironment.canUseDOM) {
      const win = (window as unknown) as WindowWithPosthog

      interval = setInterval(() => {
        if (attempts.current >= MAX_ATTEMPTS) {
          clearInterval(interval)
        }

        attempts.current += 1

        const hasPosthog =
          // use nullish coalescing operator, to avoid errors,
          // because browser might have rejected posthog
          Boolean(win.posthog?.get_distinct_id)

        if (hasPosthog) {
          const id = win.posthog.get_distinct_id()
          setUrl(`${url}?utm_id=${id}`)
          clearInterval(interval)
        }
      }, 200)
    }

    return () => {
      clearInterval(interval)
    }
  }, [])

  return url
}
