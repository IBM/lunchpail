import type { ReactNode } from "react"

import { Flex } from "@patternfly/react-core"

import GridCell from "./GridCell"
import Sparkline from "./Sparkline"
import GridLayout from "./GridLayout"
import SmallLabel from "./SmallLabel"
import CardInGallery from "./CardInGallery"

import { meanCompletionRate, completionRateHistory } from "./CompletionRate"

import type { WorkerPoolModelWithHistory } from "./WorkerPoolModel"
import type WorkerPoolStatusEvent from "../events/WorkerPoolStatusEvent"

import WorkerPoolIcon from "@patternfly/react-icons//dist/esm/icons/server-icon"

interface Props {
  model: WorkerPoolModelWithHistory

  /** Map DataSetModel.label to a dense index */
  datasetIndex: Record<string, number>

  /** This will be ordered from least recent to most recent */
  statusHistory: WorkerPoolStatusEvent[]
}

export default class WorkerPool extends CardInGallery<Props> {
  protected override label() {
    return this.props.model.label
  }

  protected override icon() {
    return <WorkerPoolIcon />
  }

  protected override actions() {
    return {
      hasNoOffset: true,
      actions: !this.props.statusHistory?.length
        ? []
        : [
            <SmallLabel key="status">
              {this.props.statusHistory[this.props.statusHistory.length - 1].status}
            </SmallLabel>,
          ],
    }
  }

  protected override summaryGroups() {
    const cells = this.underwayCells()

    return [
      this.applications && this.descriptionGroup("Applications", <SmallLabel>{this.applications}</SmallLabel>),
      this.datasets && this.descriptionGroup("Task Queues", <SmallLabel>{this.datasets}</SmallLabel>),
      this.descriptionGroup("Processing", /*this.underway(cells),*/ cells.length),
      this.descriptionGroup(
        "Completion Rate",
        this.completionRate(),
        meanCompletionRate(this.props.model.events) || "None",
      ),
      this.descriptionGroup(`Queued Work (${this.pluralize("worker", this.size)})`, this.enqueued()),
    ]
  }

  private get inboxes() {
    return this.props.model.inbox
  }

  private get outboxes() {
    return this.props.model.outbox
  }

  private get processing() {
    return this.props.model.processing
  }

  private get size() {
    return !this.props.statusHistory?.length ? 0 : this.props.statusHistory[this.props.statusHistory.length - 1].size
  }

  /** One row per worker, within row, one cell per inbox or outbox enqueued task */
  private enqueued() {
    return (
      <div className="codeflare--workqueues">
        {this.inboxes.map((inbox, i) => (
          <GridLayout
            key={i}
            queueNum={i + 1}
            inbox={inbox}
            datasetIndex={this.props.datasetIndex}
            gridTypeData="plain"
          />
        ))}
      </div>
    )
  }

  private underwayCells(props = this.props) {
    return (props.model.processing || []).flatMap((processing, workerIdx) =>
      Object.entries(processing)
        .filter(([, size]) => size > 0)
        .flatMap(([dataset, size]) =>
          Array(size)
            .fill(0)
            .map((_, i) => (
              <GridCell
                key={dataset + "." + workerIdx + "." + i}
                type="processing"
                dataset={props.datasetIndex[dataset]}
              />
            )),
        ),
    )
  }

  /** One row across workers, one cell per in-process task */
  private underway(cells: ReactNode[]) {
    return <Flex gap={{ default: "gapXs" }}>{cells}</Flex>
  }

  private pluralize(text: string, value: number) {
    return `${value} ${text}${value !== 1 ? "s" : ""}`
  }

  private prettyRate(tasksPerMilli: number) {
    const tasksPerSecond = tasksPerMilli * 1000

    if (tasksPerMilli === 0 || isNaN(tasksPerMilli)) {
      return ""
    } else if (tasksPerSecond < 1) {
      const tasksPerMinute = tasksPerSecond * 60
      if (tasksPerMinute < 1) {
        const tasksPerHour = tasksPerMinute * 60
        if (tasksPerHour < 1) {
          const tasksPerDay = tasksPerHour * 24
          return `${this.pluralize("task", Math.round(tasksPerDay))}/day`
        } else {
          return `${this.pluralize("task", Math.round(tasksPerHour))}/hr`
        }
      } else {
        return `${this.pluralize("task", Math.round(tasksPerMinute))}/min`
      }
    } else {
      return `${this.pluralize("task", Math.round(tasksPerSecond))}/sec`
    }
  }

  private completionRate() {
    return <Sparkline data={completionRateHistory(this.props.model.events)} />
  }

  private get statusHistory() {
    return this.props.statusHistory
  }

  private get applications() {
    if (this.statusHistory.length > 0) {
      return this.statusHistory[this.statusHistory.length - 1].applications
    }
  }

  private get datasets() {
    if (this.statusHistory.length > 0) {
      return this.statusHistory[this.statusHistory.length - 1].datasets
    }
  }

  // do we need this any more? we used to have it in the <Card className/>
  // "codeflare--card-header-no-wrap"
}
