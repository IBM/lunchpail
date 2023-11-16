import type Props from "./Props"
import prettyPrintWorkerPoolName from "../../workerpools/components/pretty-print"

import { singular } from "../name"
import { datasets } from "./taskqueueProps"
import { name as workerpoolsName } from "../../workerpools/name"
import { name as datasetsName } from "../../datasets/name"

import None from "@jay/components/None"
import { linkToAllDetails } from "@jay/renderer/navigate/details"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

export function api(props: Props) {
  const { api } = props.application.spec

  if (api === "workqueue") {
    return []
  } else {
    return [descriptionGroup("api", api, undefined, "The API used by this Application to distribute work.")]
  }
}

/* export function taskqueuesGroup(props: Props) {
  const queues = taskqueues(props)

  return (
    queues.length > 0 &&
    descriptionGroup(
      taskqueuesName,
      queues.length === 0 ? None() : linkToAllDetails("taskqueues", queues),
      queues.length,
      "The Task Queues this application is capable of processing, i.e. those that it is compatible with.",
    )
  )
} */

export function datasetsGroup(props: Props) {
  const data = datasets(props)

  return (
    data.length > 0 &&
    descriptionGroup(
      datasetsName,
      data.length === 0 ? None() : linkToAllDetails("datasets", data),
      data.length,
      `The ${datasetsName} this ${singular} requires as input.`,
    )
  )
}

export function workerpoolsGroup(props: Props, taskqueueName: string) {
  const pools = associatedWorkerPools(props)

  return (
    pools.length > 0 &&
    descriptionGroup(
      workerpoolsName,
      linkToAllDetails(
        "workerpools",
        pools,
        pools.map((_) => prettyPrintWorkerPoolName(_.metadata.name, taskqueueName)),
      ),
      pools.length,
      `The ${workerpoolsName} assigned to this ${singular}.`,
    )
  )
}

export function associatedWorkerPools(props: Props) {
  return props.workerpools.filter((_) => _.spec.application.name === props.application.metadata.name)
}

export function hasWorkerPool(props: Props) {
  return associatedWorkerPools(props).length > 0
}
