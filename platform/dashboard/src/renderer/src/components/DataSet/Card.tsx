import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"

import { singular } from "../../names"

import type DataSetEvent from "@jay/common/events/DataSetEvent"

import DataSetIcon from "./Icon"

export default function DataSetCard(props: DataSetEvent) {
  const groups = [
    descriptionGroup("description", props.metadata.annotations["codeflare.dev/description"]),
    descriptionGroup(
      "endpoint",
      props.spec.local.endpoint,
      undefined,
      `The S3 endpoint URL of this ${singular.datasets}`,
    ),
    descriptionGroup(
      "bucket",
      props.spec.local.bucket,
      undefined,
      `The S3 bucket that this ${singular.datasets} covers`,
    ),
  ]

  return <CardInGallery kind="datasets" name={props.metadata.name} icon={<DataSetIcon />} groups={groups} />
}
