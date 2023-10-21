import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import WorkQueueIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon"
import ApplicationIcon from "@patternfly/react-icons/dist/esm/icons/code-icon"

import rayImageUrl from "../../images/ray.png"
import sparkImageUrl from "../../images/spark.svg"
import pytorchImageUrl from "../../images/pytorch.svg"

export default function applicationIcon(props: ApplicationSpecEvent) {
  switch (props.api) {
    case "ray":
      return <img className="codeflare--card-icon-image" src={rayImageUrl} />
    case "torch":
      return <img className="codeflare--card-icon-image" src={pytorchImageUrl} />
    case "spark":
      return <img className="codeflare--card-icon-image" src={sparkImageUrl} />
    case "workqueue":
      return <WorkQueueIcon />
    default:
      return <ApplicationIcon />
  }
}
