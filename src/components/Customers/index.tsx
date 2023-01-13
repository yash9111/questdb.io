import React, { useLayoutEffect, useState } from "react"
import { Section } from "../Section"
import styles from "./styles.module.css"
import Marquee from "react-fast-marquee"
import useThemeContext from "@theme/hooks/useThemeContext"
import { Logos } from "./logos"

const Customers = () => {
  const { isDarkTheme } = useThemeContext()
  const [rendered, setRendered] = useState(false)

  useLayoutEffect(() => {
    setRendered(true)
  }, [])

  return (
    <Section noGap className={styles.section}>
      {rendered && (
        <Marquee gradientColor={isDarkTheme ? [33, 34, 44] : [255, 255, 255]}>
          <div className={styles.logos}>
            <Logos isDarkTheme={isDarkTheme} />
          </div>
        </Marquee>
      )}
    </Section>
  )
}

export default Customers
