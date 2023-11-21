import { linkToAllDetails } from "@jay/renderer/navigate/details"
import { LinkToNewDataSet } from "../../../../datasets/components/New/Button"

import type Step from "../Step"
import { datasets } from "../../taskqueueProps"

import { groupSingular as singular } from "../../../group"
import { singular as datasetSingular } from "../../../../datasets/name"

const step: Step = {
  id: "Data",
  variant: (props) => (datasets(props).length > 0 ? "success" : "default"),
  content: (props, onClick) => {
    const data = datasets(props)
    if (data.length === 0) {
      return (
        <span>
          If your {singular} needs access to a {datasetSingular}, link it in.{" "}
          <div>
            <LinkToNewDataSet isInline action="create" onClick={onClick} />
          </div>
        </span>
      )
    } else {
      return (
        <span>
          Your {singular} has access to {data.length === 1 ? "this" : "these"} {datasetSingular}:
          <div>{linkToAllDetails("datasets", data, undefined, onClick)}</div>
        </span>
      )
    }
  },
}

export default step
