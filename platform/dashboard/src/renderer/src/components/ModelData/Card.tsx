import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"

import type { BaseProps } from "../CardInGallery"
import type DataSetEvent from "@jay/common/events/ModelDataEvent"

import DataSetIcon from "../TaskQueue/Icon"

export default function DataSetCard(props: BaseProps & DataSetEvent) {
  const kind = "modeldatas" as const
  const icon = <DataSetIcon />
  const name = props.metadata.name
  const groups = [
    descriptionGroup("endpoint", props.spec.local.endpoint, undefined, "The S3 endpoint URL."),
    descriptionGroup("bucket", props.spec.local.bucket, undefined, "The S3 bucket."),
    // props.spec.description && descriptionGroup("Description", props.spec.description),
  ]

  return <CardInGallery {...props} kind={kind} name={name} icon={icon} groups={groups} />
}
