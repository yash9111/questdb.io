import React from "react"
import styles from "./styles.module.css"
import Button from "@theme/Button"
import CameraIcon from "../../../assets/img/camera.svg"
import MessageIcon from "../../../assets/img/message.svg"
import { GetAccess } from "../get-access"
import { useCloudUrl } from "../../../utils/cloud-url"
import clsx from "clsx"

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
      <div className={styles.actions}>
        <Button
          size="xxsmall"
          variant="tertiary"
          icon={<CameraIcon />}
          to="/cloud/book-a-demo"
          uppercase={false}
        >
          Book a demo
        </Button>
        or
        <GetAccess
          trigger={
            <Button
              size="xxsmall"
              variant="tertiary"
              icon={<MessageIcon />}
              uppercase={false}
            >
              Contact us
            </Button>
          }
        />
      </div>
    </div>
  )
}
