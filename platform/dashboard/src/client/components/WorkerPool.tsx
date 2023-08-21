import { PureComponent } from "react"
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from "@patternfly/react-core"

import GridCell from "./GridCell"
import GridLayout from "./GridLayout"
import SmallLabel from "./SmallLabel"
import type WorkerPoolModel from "./WorkerPoolModel"

interface Props {
  maxNWorkers: number
  model: WorkerPoolModel
  datasetIndex: Record<string, number>
}

type State = {
  underwayCells: import("react").ReactNode[]
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
      <Flex gap={{ default: "gapXs" }} direction={{ default: "column" }}>
        {this.inboxes.map((inbox, i) => (
          <GridLayout
            key={i}
            maxNWorkers={this.props.maxNWorkers}
            queueNum={i + 1}
            inbox={inbox}
            outbox={this.outboxes[i]}
            datasetIndex={this.props.datasetIndex}
          />
        ))}
      </Flex>
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
      return [<GridCell type="placeholder" dataset={-1} />]
    } else {
      return cells
    }
  }

  /** One row across workers, one cell per in-process task */
  private underway() {
    return <Flex gap={{ default: "gapXs" }}>{this.state?.underwayCells}</Flex>
  }

  private descriptionGroup(term: string, description: import("react").ReactNode, count?: number) {
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
      <Card isCompact isPlain>
        <CardTitle component="h4">{this.label()}</CardTitle>
        <CardBody>
          <DescriptionList>
            {this.descriptionGroup("Processing", this.underway(), this.state?.underwayCells.length)}
            {this.descriptionGroup("Queued Work", this.enqueued())}
          </DescriptionList>
        </CardBody>
      </Card>
    )
  }
}
