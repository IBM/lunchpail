import { Bullseye } from "@patternfly/react-core"

import CardInGallery from "../CardInGallery"
import { linkToNewPool } from "../../navigate/newpool"

import type BaseProps from "./Props"
import type { LocationProps } from "../../router/withLocation"

import { associatedApplications, commonGroups } from "./common"

import DataSetIcon from "./Icon"

type Props = BaseProps &
  Omit<LocationProps, "navigate"> & {
    /** To help with keeping react re-rendering happy */
    numEvents: number
  }

export default class DataSet extends CardInGallery<Props> {
  protected override kind() {
    return "datasets" as const
  }

  protected override icon() {
    return <DataSetIcon />
  }

  protected override label() {
    return this.props.label
  }

  /* private get outboxHistory() {
    return this.props.events.map((_) => _.outbox)
  } */

  /* private get last() {
    return this.props.events.length === 0 ? null : this.props.events[this.props.events.length - 1]
  } */

  /* private zeroCompletionRate() {
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
          None(){" "}
          <Button className="codeflare--card-in-gallery-help-button" onClick={this.stopPropagation} variant="plain">
            <HelpIcon />
          </Button>
        </>
      </Popover>
    )
  } */

  /* private completionRate() {
    return this.descriptionGroup(
      "Completion Rate (mean)",
      meanCompletionRate(this.props.events) || this.zeroCompletionRate(),
    )
  } */

  /* private completionRateChart() {
    const mean = meanCompletionRate(this.props.events)
    return this.descriptionGroup(
      "Completion Rate",
      !mean ? None() : <Sparkline data={completionRateHistory(this.props.events)} />,
      mean || undefined,
    )
  } */

  protected override groups() {
    return [...commonGroups(this.props) /*, this.completionRateChart()*/]
  }

  protected override footer() {
    return (
      associatedApplications(this.props).length > 0 && <Bullseye>{linkToNewPool(this.label(), this.props)}</Bullseye>
    )
  }
}
