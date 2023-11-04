import { Link } from "react-router-dom"

import { hash } from "./navigate/kind"
import { name } from "../../../package.json"

import type {
  CredentialsKind,
  NamedKind,
  NonResourceKind,
  DetailableKind,
  NavigableKind,
  ResourceKind,
  DetailOnlyKind,
} from "./Kind"

export const nonResourceNames: Record<NonResourceKind, string> = {
  controlplane: "Control Plane",
}

export const resourceNames: Record<ResourceKind | DetailOnlyKind, string> = {
  taskqueues: "Task Queues",
  workerpools: "Worker Pools",
  applications: "Applications",
  datasets: "Datasets",
}

export const credentialsNames: Record<CredentialsKind, string> = {
  platformreposecrets: "Repo Secrets",
}

const names: Record<DetailableKind, string> = Object.assign({}, nonResourceNames, resourceNames, credentialsNames)

export const singular: Record<NamedKind, string> = {
  applications: "Application",
  taskqueues: "Task Queue",
  datasets: "Dataset",
  workerpools: "Worker Pool",
  platformreposecrets: "Repo Secret",
}

function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1)
}

export const subtitles: Record<NavigableKind, import("react").ReactNode> = {
  controlplane: (
    <span>
      <strong>{capitalize(name)}</strong> helps you to manage your Jobs: pick Data to analyze, and then assign{" "}
      <Link to={hash("workerpools")}>Workers</Link> to process the tasks in a selected set of data.
    </span>
  ),
  applications: (
    <span>
      Each <strong>{singular.applications}</strong> has a base image, a code repository, and some configuration
      defaults. Each may define one or more compatible {names.taskqueues}.
    </span>
  ),
  datasets: (
    <span>
      Each <strong>{singular.datasets}</strong> resource stores extra data needed by{" "}
      <Link to={hash("applications")}>Applications</Link>, beyond that which is provided by an input Task. For example:
      a pre-trained model or a chip design that is being tested across multiple configurations.
    </span>
  ),
  workerpools: (
    <span>
      The registered compute pools in your system. Each <strong>Worker Pool</strong> is a set of workers that can
      process tasks from one or more {names.taskqueues}.
    </span>
  ),
  platformreposecrets: (
    <span>The registered GitHub credentials that can be used to clone repositories from a particular GitHub URL.</span>
  ),
}

export default names
