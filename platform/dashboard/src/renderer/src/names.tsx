import { Link } from "react-router-dom"

import { hash } from "./navigate/kind"

import type { CredentialsKind, NamedKind, NonResourceKind, NavigableKind, ResourceKind } from "./Kind"

export const nonResourceNames: Record<NonResourceKind, string> = {
  welcome: "Welcome",
}

export const resourceNames: Record<ResourceKind, string> = {
  datasets: "Task Queues",
  workerpools: "Worker Pools",
  applications: "Applications",
}

export const credentialsNames: Record<CredentialsKind, string> = {
  platformreposecrets: "Repo Secrets",
}

const names: Record<NavigableKind, string> = Object.assign({}, nonResourceNames, resourceNames, credentialsNames)

export const singular: Record<NamedKind, string> = {
  applications: "Application",
  datasets: "Task Queue",
  workerpools: "Worker Pool",
  platformreposecrets: "Repo Secret",
}

export const subtitles: Record<NavigableKind, import("react").ReactNode> = {
  welcome: (
    <span>
      <strong>Jobs as a Service</strong> lets you assign <Link to={hash("workerpools")}>Workers</Link> to process{" "}
      <Link to={hash("datasets")}>Queued work</Link> without having to worry about managing long-lived clusters.
    </span>
  ),
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
  platformreposecrets: (
    <span>The registered GitHub credentials that can be used to clone repositories from a particular GitHub URL.</span>
  ),
}

export default names
