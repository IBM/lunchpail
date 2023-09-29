import type { ReactNode } from "react"

import { Flex } from "@patternfly/react-core"

import SmallLabel from "../SmallLabel"
import CardInGallery from "../CardInGallery"

import type Props from "./Props"

import { summaryGroups, pluralize } from "./Summary"

import WorkerPoolIcon from "./Icon"

export default class WorkerPool extends CardInGallery<Props> {
  protected override label() {
    return this.props.model.label
  }

  protected override icon() {
    return <WorkerPoolIcon />
  }

  protected override summaryGroups() {
    return summaryGroups(this.props)
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

  private get outboxes() {
    return this.props.model.outbox
  }

  private get processing() {
    return this.props.model.processing
  }

  /* private underwayCells(props = this.props) {
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
  } */

  /** One row across workers, one cell per in-process task */
  private underway(cells: ReactNode[]) {
    return <Flex gap={{ default: "gapXs" }}>{cells}</Flex>
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
          return `${pluralize("task", Math.round(tasksPerDay))}/day`
        } else {
          return `${pluralize("task", Math.round(tasksPerHour))}/hr`
        }
      } else {
        return `${pluralize("task", Math.round(tasksPerMinute))}/min`
      }
    } else {
      return `${pluralize("task", Math.round(tasksPerSecond))}/sec`
    }
  }

  // do we need this any more? we used to have it in the <Card className/>
  // "codeflare--card-header-no-wrap"
}
