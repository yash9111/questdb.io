import React from "react"
import styles from "./styles.module.css"
import Button from "@theme/Button"
import customFields from "../../../config/customFields"

export const StartBuilding = () => {
  return (
    <div className={styles.startBuildingRoot}>
      <img
        src="/img/pages/cloud/cloud-cpu.png"
        width={478}
        height={176}
        alt="An image showing QuestDB Cloud instance details"
        className={styles.startBuildingImage}
      />
      <img
        src="/img/pages/cloud/cloud-metrics.png"
        width={478}
        height={124}
        alt="An image showing CPU usage graph from QuestDB Cloud instance"
        className={styles.startBuildingImage}
      />
      <Button
        variant="primary"
        className={styles.startBuildingButton}
        to={customFields.cloudUrl}
        newTab={false}
      >
        Start building now
      </Button>
      <span className={styles.startBuildingCredits}>$200 in free credits</span>
    </div>
  )
}
