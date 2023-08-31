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
          return Math.round(tasksPerDay) + " tasks/day"
        } else {
          return Math.round(tasksPerHour) + " tasks/hr"
        }
      } else {
        return Math.round(tasksPerMinute) + " tasks/min"
      }
    } else {
      return Math.round(tasksPerSecond) + " tasks/sec"
    }
  }

  private get completionRateHistory() {
    const { timestamps } = this.props.model
    return this.props.model.outboxHistory.map((completions, idx) =>
      idx === 0 ? 0 : completions / (timestamps[idx] - timestamps[idx - 1] || 1),
    )
  }

  private get instantaneousCompletionRate() {
    const { outboxHistory, timestamps } = this.props.model
    const N = timestamps.length

    if (!this.state) {
      return ""
    } else if (N <= 1) {
      return ""
    } else {
      const durationMillis = timestamps[N - 1] - timestamps[N - 2]
      return this.prettyRate(outboxHistory[N - 1] / durationMillis)
    }
  }

  private get medianCompletionRate() {
    const A = this.completionRateHistory.sort()
    return A.length === 0 ? 0 : this.prettyRate(A[Math.round(A.length / 2)])
  }

  private completionRate() {
    return <Sparkline data={this.completionRateHistory} />
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
            {this.descriptionGroup("Completion Rate", this.completionRate(), this.medianCompletionRate)}
            {this.descriptionGroup(
              `Queued Work (${this.nWorkers} ${this.nWorkers === 1 ? "worker" : "workers"})`,
              this.enqueued(),
            )}
          </DescriptionList>
        </CardBody>
      </Card>
    )
  }
}
