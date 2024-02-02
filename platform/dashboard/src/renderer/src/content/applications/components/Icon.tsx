import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

import ApplicationIcon from "@patternfly/react-icons/dist/esm/icons/code-icon"
import ApplicationWorkQueueIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon"

import rayImageUrl from "@jaas/images/ray.png"
import sparkImageUrl from "@jaas/images/spark.svg"
import pytorchImageUrl from "@jaas/images/pytorch.svg"

export { ApplicationWorkQueueIcon }

export default function applicationIcon(props: ApplicationSpecEvent) {
  const className = ""
  const classNameForImg = ["codeflare--card-icon-image"].join(" ")

  switch (props.spec.api) {
    case "ray":
      return <img className={classNameForImg} src={rayImageUrl} />
    case "torch":
      return <img className={classNameForImg} src={pytorchImageUrl} />
    case "spark":
      return <img className={classNameForImg} src={sparkImageUrl} />
    case "workqueue":
      return <ApplicationWorkQueueIcon className={className} />
    default:
      return <ApplicationIcon className={className} />
  }
}
