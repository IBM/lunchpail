import { PureComponent, ReactNode } from "react"
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderProps,
  CardTitle,
  Flex,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
  Stack,
  StackItem,
} from "@patternfly/react-core"

import GridCell from "./GridCell"
import Sparkline from "./Sparkline"
import GridLayout from "./GridLayout"
import SmallLabel from "./SmallLabel"

import { medianCompletionRate, completionRateHistory } from "./CompletionRate"

import type { WorkerPoolModelWithHistory } from "./WorkerPoolModel"
import type WorkerPoolStatusEvent from "../events/WorkerPoolStatusEvent"

interface Props {
  maxNWorkers: number
  model: WorkerPoolModelWithHistory
  datasetIndex: Record<string, number>

  /** This will be ordered from least recent to most recent */
  statusHistory: WorkerPoolStatusEvent[]
}

type State = Pick<WorkerPoolStatusEvent, "ready" | "size"> & {
  /** UI for processing tasks */
  underwayCells: ReactNode[]

  /** Header actions */
  actions: CardHeaderProps["actions"]
}

export default class WorkerPool extends PureComponent<Props, State> {
  public constructor(props: Props) {
    super(props)
    this.state = {
      size: 0,
      ready: 0,
      underwayCells: [],
      actions: { actions: [] },
    }
  }

  public label() {
    return this.props.model.label
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

  public static getDerivedStateFromProps(props: Props) {
    return {
      underwayCells: WorkerPool.underwayCells(props),
      size: !props.statusHistory?.length ? 0 : props.statusHistory[props.statusHistory.length - 1].size,
      nReadyWorkers: !props.statusHistory?.length ? 0 : props.statusHistory[props.statusHistory.length - 1].ready,
      actions: {
        hasNoOffset: true,
        actions: !props.statusHistory?.length
          ? []
          : [<SmallLabel key="status">{props.statusHistory[props.statusHistory.length - 1].status}</SmallLabel>],
      },
    }
  }

  /** One row per worker, within row, one cell per inbox or outbox enqueued task */
  private enqueued() {
    return (
      <Stack className="codeflare-workqueues">
        {this.inboxes.map((inbox, i) => (
          <StackItem key={i}>
            <GridLayout
              maxNWorkers={this.props.maxNWorkers}
              queueNum={i + 1}
              inbox={inbox}
              datasetIndex={this.props.datasetIndex}
            />
          </StackItem>
        ))}
      </Stack>
    )
  }

  private static underwayCells(props: Props) {
    const cells = (props.model.processing || []).flatMap((processing, workerIdx) =>
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
    if (cells.length === 0) {
      return [<GridCell key="-1" type="placeholder" dataset={-1} />]
    } else {
      return cells
    }
  }

  /** One row across workers, one cell per in-process task */
  private underway() {
    return <Flex gap={{ default: "gapXs" }}>{this.state?.underwayCells}</Flex>
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
    return <Sparkline data={completionRateHistory(this.props.model)} />
  }

  private descriptionGroup(term: ReactNode, description: ReactNode, count?: number | string) {
    return (
      <DescriptionListGroup>
        <DescriptionListTerm>
          <SmallLabel count={count}>{term}</SmallLabel>
        </DescriptionListTerm>
        <DescriptionListDescription>{description}</DescriptionListDescription>
      </DescriptionListGroup>
    )
  }

  private get statusHistory() {
    return this.props.statusHistory
  }

  private get applications() {
    if (this.statusHistory.length > 0) {
      return this.statusHistory[this.statusHistory.length - 1].applications
    }
  }

  public override render() {
    return (
      <Card isRounded isClickable isSelectable>
        <CardHeader actions={this.state?.actions}>
          <CardTitle>{this.label()}</CardTitle>
        </CardHeader>
        <CardBody>
          <DescriptionList isCompact>
            {this.applications && this.descriptionGroup("Applications", <SmallLabel>{this.applications}</SmallLabel>)}
            {this.descriptionGroup("Completion Rate", this.completionRate(), medianCompletionRate(this.props.model))}
            {this.descriptionGroup("Processing", this.underway(), this.state?.underwayCells.length)}
            {this.descriptionGroup(`Queued Work (${this.pluralize("worker", this.state?.size)})`, this.enqueued())}
          </DescriptionList>
        </CardBody>
      </Card>
    )
  }
}
