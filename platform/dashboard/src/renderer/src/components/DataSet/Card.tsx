import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"

import type { BaseProps } from "../CardInGallery"
import type DataSetEvent from "@jay/common/events/DataSetEvent"

import DataSetIcon from "./Icon"

export default function DataSetCard(props: BaseProps & DataSetEvent) {
  const groups = [
    descriptionGroup("endpoint", props.spec.local.endpoint, undefined, "The S3 endpoint URL."),
    descriptionGroup("bucket", props.spec.local.bucket, undefined, "The S3 bucket."),
    // props.spec.description && descriptionGroup("Description", props.spec.description),
  ]

  return <CardInGallery {...props} kind="datasets" name={props.metadata.name} icon={<DataSetIcon />} groups={groups} />
}
