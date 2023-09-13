import { PureComponent, ReactNode } from "react"
import {
  Card,
  CardBody,
  CardHeader,
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

interface Props {
  maxNWorkers: number
  model: WorkerPoolModelWithHistory
  datasetIndex: Record<string, number>
}

type State = {
  /** UI for processing tasks */
  underwayCells: ReactNode[]
}

export default class WorkerPool extends PureComponent<Props, State> {
  public constructor(props: Props) {
    super(props)
    this.state = {
      underwayCells: [],
    }
  }

  public label() {
    return `WorkerPool ${this.props.model.label}`
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

  private get nWorkers() {
    return this.inboxes.length
  }

  public static getDerivedStateFromProps(props: Props) {
    return {
      underwayCells: WorkerPool.underwayCells(props),
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

  public override render() {
    return (
      <Card isCompact isRounded>
        <CardHeader>
          <CardTitle component="h4">{this.label()}</CardTitle>
        </CardHeader>
        <CardBody>
          <DescriptionList isCompact>
            {this.descriptionGroup("Processing", this.underway(), this.state?.underwayCells.length)}
            {this.descriptionGroup(
              "Completion Rate (this pool)",
              this.completionRate(),
              medianCompletionRate(this.props.model),
            )}
            {this.descriptionGroup(`Queued Work (${this.pluralize("worker", this.nWorkers)})`, this.enqueued())}
          </DescriptionList>
        </CardBody>
      </Card>
    )
  }
}
