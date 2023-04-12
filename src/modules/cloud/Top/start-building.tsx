import React from "react"
import styles from "./styles.module.css"
import Button from "@theme/Button"
import { useCloudUrl } from "../../../utils/cloud-url"
import clsx from "clsx"
import { BookADemoButtons } from "../../book-a-demo-buttons"

export const StartBuilding = () => {
  const cloudUrl = useCloudUrl()

  return (
    <div className={styles.startBuildingRoot}>
      <img
        src="/img/pages/cloud/cloud-cpu.png"
        width={478}
        height={176}
        alt="An image showing QuestDB Cloud instance details"
        className={clsx(styles.startBuildingImage, styles.instanceDetailsImage)}
      />
      <img
        src="/img/pages/cloud/cloud-metrics.png"
        width={478}
        height={124}
        alt="An image showing CPU usage graph from QuestDB Cloud instance"
        className={clsx(styles.startBuildingImage, styles.instanceMetricsImage)}
      />
      <Button
        variant="primary"
        className={styles.startBuildingButton}
        to={cloudUrl}
        newTab={false}
      >
        Start building now
      </Button>
      <span className={styles.startBuildingCredits}>$200 in free credits</span>
      <BookADemoButtons className={styles.actions} />
    </div>
  )
}
