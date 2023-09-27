import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Button, Popover } from "@patternfly/react-core"

import Queue from "./Queue"
import Sparkline from "./Sparkline"
import CardInGallery from "./CardInGallery"
import type { GridTypeData } from "./GridCell"

import { meanCompletionRate, completionRateHistory } from "./CompletionRate"

import type DataSetModel from "./DataSetModel"
import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"

import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon"
import DataSetIcon from "@patternfly/react-icons/dist/esm/icons/database-icon"
export { DataSetIcon }

type Props = Pick<DataSetModel, "idx" | "label"> & {
  events: DataSetModel[]
  numEvents: number

  /** Latest set of Application s*/
  applications: ApplicationSpecEvent[]

  /** Map DataSetModel.label to a dense index */
  datasetIndex: Record<string, number>
}

export default class DataSet extends CardInGallery<Props> {
  private associatedApplications() {
    const { label } = this.props

    const apps = this.props.applications.filter((app) => {
      if (app["data sets"]) {
        const { xs, sm, md, lg, xl } = app["data sets"]
        return xs === label || sm === label || md === label || lg === label || xl === label
      }
    })

    return this.descriptionGroup(
      "Associated Applications",
      apps.length === 0 ? this.none() : apps.map((_) => _.application),
    )
  }

  private cells(count: number, gridDataType: GridTypeData) {
    if (!count) {
      return (
        <Queue inbox={{ [this.props.label]: 0 }} datasetIndex={this.props.datasetIndex} gridTypeData="placeholder" />
      )
    }
    return (
      <Queue
        inbox={{ [this.props.label]: this.inboxCount }}
        datasetIndex={this.props.datasetIndex}
        gridTypeData={gridDataType}
      />
    )
  }

  protected override icon() {
    return <DataSetIcon />
  }

  protected override label() {
    return this.props.label
  }

  private get inboxHistory() {
    return this.props.events.map((_) => _.inbox)
  }

  private get outboxHistory() {
    return this.props.events.map((_) => _.outbox)
  }

  private get last() {
    return this.props.events.length === 0 ? null : this.props.events[this.props.events.length - 1]
  }

  private get inboxCount() {
    return this.last ? this.last.inbox : 0
  }

  private storageType() {
    return this.descriptionGroup("Storage Type", this.last ? this.last.storageType : "unknown")
  }

  private bucket() {
    return this.descriptionGroup("Bucket", this.last ? this.last.bucket : "unknown")
  }

  private unassigned() {
    return this.descriptionGroup("Tasks", this.cells(this.inboxCount, "unassigned"), this.inboxCount)
  }

  private unassignedChart() {
    return this.descriptionGroup(
      "Tasks over Time",
      this.inboxHistory.length === 0 ? <></> : <Sparkline data={this.inboxHistory} datasetIdx={this.props.idx} />,
    )
  }

  private zeroCompletionRate() {
    // PopoverProps does not support onClick; we add it instead to
    // headerContent and bodyContent -- imperfect, but the best we can
    // do for now, it seems
    return (
      <Popover
        headerContent={<span onClick={this.stopPropagation}>No progress is being made</span>}
        bodyContent={
          <span onClick={this.stopPropagation}>
            Consider assigning a{" "}
            <Link onClick={this.stopPropagation} to={`?dataset=${this.label()}#newpool`}>
              New Worker Pool
            </Link>{" "}
            to process this Data Set
          </span>
        }
      >
        <>
          this.none(){" "}
          <Button className="codeflare--card-in-gallery-help-button" onClick={this.stopPropagation} variant="plain">
            <HelpIcon />
          </Button>
        </>
      </Popover>
    )
  }

  private completionRate() {
    return this.descriptionGroup(
      "Completion Rate (mean)",
      meanCompletionRate(this.props.events) || this.zeroCompletionRate(),
    )
  }

  private completionRateChart() {
    const mean = meanCompletionRate(this.props.events)
    return this.descriptionGroup(
      "Completion Rate",
      !mean ? this.none() : <Sparkline data={completionRateHistory(this.props.events)} />,
      mean || undefined,
    )
  }

  private commonGroups(): ReactNode[] {
    return [this.associatedApplications(), this.unassigned()]
  }

  protected override summaryGroups() {
    return [...this.commonGroups(), this.completionRateChart()]
  }

  protected override detailGroups() {
    return [
      this.storageType(),
      this.bucket(),
      ...this.commonGroups(),
      this.unassignedChart(),
      this.completionRateChart(),
    ]
  }
}
