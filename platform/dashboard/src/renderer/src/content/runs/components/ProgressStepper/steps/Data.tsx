import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { LinkToNewDataSet } from "@jaas/resources/datasets/components/New/Button"

import { singular as application } from "@jaas/resources/applications/name"
import { name as datasets, singular as dataset } from "@jaas/resources/datasets/name"

import type Step from "../Step"
import { datasets as associatedDatasets } from "@jaas/resources/applications/components/datasets"

const step: Step = {
  id: "Data",
  variant: (props) => (associatedDatasets(props).length > 0 ? "success" : "default"),
  content: (props, onClick) => {
    const data = associatedDatasets(props)
    if (data.length === 0) {
      const body = (
        <span>
          If your {application} needs access to a {dataset}, link it in.{" "}
        </span>
      )

      const footer = <LinkToNewDataSet isInline action="create" onClick={onClick} />

      return { body, footer }
    } else {
      return (
        <span>
          Your {application} has access to <strong>{data.length}</strong> {data.length === 1 ? dataset : datasets}:{" "}
          {linkToAllDetails("datasets", data, undefined, onClick)}
        </span>
      )
    }
  },
}

export default step
