import React from "react"
import Button from "@theme/Button"
import { GetAccess } from "../cloud/get-access"
import CameraIcon from "../../assets/img/camera.svg"
import MessageIcon from "../../assets/img/message.svg"
import styles from "./styles.module.css"
import clsx from "clsx"

type Props = {
  className?: string
}

export const BookADemoButtons = ({ className }: Props) => (
  <div className={clsx(styles.root, className)}>
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
)
