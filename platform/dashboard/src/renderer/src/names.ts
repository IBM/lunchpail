/** !!! TODO there are a few lingering uses of this file. Port them to content/providers and then elimiate this file. */

import type { CredentialsKind, NonResourceKind, DetailableKind, ResourceKind, DetailOnlyKind } from "./Kind"

import { name as datasetsName } from "./content/datasets/name"
import { name as taskqueuesName } from "./content/taskqueues/name"
import { name as workerpoolsName } from "./content/workerpools/name"
import { name as controlPlaneName } from "./content/controlplane/name"
import { name as applicationsName } from "./content/applications/name"

export const nonResourceNames: Record<NonResourceKind, string> = {
  controlplane: controlPlaneName,
}

export const resourceNames: Record<ResourceKind | DetailOnlyKind, string> = {
  taskqueues: taskqueuesName,
  workerpools: workerpoolsName,
  applications: applicationsName,
  datasets: datasetsName,
}

export const credentialsNames: Record<CredentialsKind, string> = {
  platformreposecrets: "Repo Secrets",
}

const names: Record<DetailableKind, string> = Object.assign({}, nonResourceNames, resourceNames, credentialsNames)

export default names
