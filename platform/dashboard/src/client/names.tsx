import { Link } from "react-router-dom"

import { hash } from "./navigate/kind"

export type Kind = "applications" | "datasets" | "workerpools"

const names: Record<Kind, string> = {
  applications: "Applications",
  datasets: "Task Queues",
  workerpools: "Worker Pools",
}

export const subtitles: Record<Kind, import("react").ReactNode> = {
  applications: (
    <span>
      The registered code bases in your system. Each <strong>Application</strong> has a base image, a code repository,
      and some configuration defaults. An Application may define one or more compatible{" "}
      <Link to={hash("datasets")}>Task Queues</Link>.
    </span>
  ),
  datasets: (
    <span>
      The registered queues in your system. Each <strong>Task Queue</strong> is registered to be compatible with one or
      more <Link to={hash("applications")}>Applications</Link>, and is linked to a data store as the place to queue up
      the to-do tasks.
    </span>
  ),
  workerpools: (
    <span>
      The registered compute pools in your system. Each <strong>Worker Pool</strong> is a set of workers that can
      process tasks from one or more <Link to={hash("datasets")}>Task Queues</Link>.
    </span>
  ),
}

export default names
