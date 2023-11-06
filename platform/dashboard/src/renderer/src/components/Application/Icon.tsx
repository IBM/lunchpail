import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import WorkQueueIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon"
import ApplicationIcon from "@patternfly/react-icons/dist/esm/icons/code-icon"

import rayImageUrl from "../../images/ray.png"
import sparkImageUrl from "../../images/spark.svg"
import pytorchImageUrl from "../../images/pytorch.svg"

export default function applicationIcon(props: { application: ApplicationSpecEvent; hasWorkerPool?: boolean }) {
  const baseClasses = props.hasWorkerPool ? ["codeflare--active"] : []
  const className = baseClasses.join(" ")
  const classNameForImg = ["codeflare--card-icon-image", ...baseClasses].join(" ")

  switch (props.application.spec.api) {
    case "ray":
      return <img className={classNameForImg} src={rayImageUrl} />
    case "torch":
      return <img className={classNameForImg} src={pytorchImageUrl} />
    case "spark":
      return <img className={classNameForImg} src={sparkImageUrl} />
    case "workqueue":
      return <WorkQueueIcon className={className} />
    default:
      return <ApplicationIcon className={className} />
  }
}
