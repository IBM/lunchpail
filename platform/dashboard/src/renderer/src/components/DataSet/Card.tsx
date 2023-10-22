import CardInGallery from "../CardInGallery"
import { LinkToNewPool } from "../../navigate/newpool"

import type DataSetProps from "./Props"
import type { BaseProps } from "../CardInGallery"
import type { LocationProps } from "../../router/withLocation"

import { commonGroups, numAssociatedApplicationEvents, numAssociatedWorkerPools } from "./common"

import DataSetIcon from "./Icon"

type Props = BaseProps &
  DataSetProps &
  Omit<LocationProps, "navigate"> & {
    /** To help with keeping react re-rendering happy */
    numEvents: number
  }

export default function DataSetCard(props: Props) {
  const hasAssignedWorkers = numAssociatedWorkerPools(props) > 0

  const kind = "datasets" as const
  const icon = <DataSetIcon className={hasAssignedWorkers ? "codeflare--active" : ""} />
  const groups = [...commonGroups(props) /*, this.completionRateChart()*/]

  const footer = numAssociatedApplicationEvents(props) > 0 && (
    <LinkToNewPool
      location={props.location}
      searchParams={props.searchParams}
      dataset={props.label}
      startOrAdd={hasAssignedWorkers ? "add" : "start"}
    />
  )

  return <CardInGallery {...props} kind={kind} icon={icon} groups={groups} footer={footer} />
}
