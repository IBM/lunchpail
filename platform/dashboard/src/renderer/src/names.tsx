import { Link } from "react-router-dom"

import { hash } from "./navigate/kind"
import { name } from "../../../package.json"

import type { CredentialsKind, NamedKind, NonResourceKind, NavigableKind, ResourceKind } from "./Kind"

export const nonResourceNames: Record<NonResourceKind, string> = {
  controlplane: "Control Plane",
}

export const resourceNames: Record<ResourceKind, string> = {
  taskqueues: "Task Queues",
  workerpools: "Worker Pools",
  applications: "Applications",
  modeldatas: "Datasets",
}

export const credentialsNames: Record<CredentialsKind, string> = {
  platformreposecrets: "Repo Secrets",
}

const names: Record<NavigableKind, string> = Object.assign({}, nonResourceNames, resourceNames, credentialsNames)

export const singular: Record<NamedKind, string> = {
  applications: "Application",
  taskqueues: "Task Queue",
  modeldatas: "Dataset",
  workerpools: "Worker Pool",
  platformreposecrets: "Repo Secret",
}

function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1)
}

export const subtitles: Record<NavigableKind, import("react").ReactNode> = {
  controlplane: (
    <span>
      <strong>{capitalize(name)}</strong> helps you to manage your Jobs: pick <Link to={hash("taskqueues")}>Data</Link>{" "}
      to analyze, and then assign <Link to={hash("workerpools")}>Workers</Link> to process the tasks in a selected set
      of data.
    </span>
  ),
  applications: (
    <span>
      Each <strong>Application</strong> has a base image, a code repository, and some configuration defaults. Each may
      define one or more compatible <Link to={hash("taskqueues")}>Task Queues</Link>.
    </span>
  ),
  taskqueues: (
    <span>
      Each <strong>Task Queue</strong> is compatible with one or more{" "}
      <Link to={hash("applications")}>Applications</Link>, and is linked to a place to queue up the to-do tasks.
    </span>
  ),
  modeldatas: (
    <span>
      Each <strong>{singular.modeldatas}</strong> resource stores extra data needed by{" "}
      <Link to={hash("applications")}>Applications</Link>, beyond that which is provided by an input Task. For example:
      a pre-trained model or a chip design that is being tested across multiple configurations.
    </span>
  ),
  workerpools: (
    <span>
      The registered compute pools in your system. Each <strong>Worker Pool</strong> is a set of workers that can
      process tasks from one or more <Link to={hash("taskqueues")}>Task Queues</Link>.
    </span>
  ),
  platformreposecrets: (
    <span>The registered GitHub credentials that can be used to clone repositories from a particular GitHub URL.</span>
  ),
}

export default names
