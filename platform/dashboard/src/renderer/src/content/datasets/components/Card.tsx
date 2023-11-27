import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import { singular as datasetsSingular } from "@jay/resources/datasets/name"

import type DataSetEvent from "@jay/common/events/DataSetEvent"

import DataSetIcon from "./Icon"

export default function DataSetCard(props: DataSetEvent) {
  const groups = [
    descriptionGroup("description", props.metadata.annotations["codeflare.dev/description"]),
    descriptionGroup(
      "endpoint",
      props.spec.local.endpoint,
      undefined,
      `The S3 endpoint URL of this ${datasetsSingular}`,
    ),
    descriptionGroup(
      "bucket",
      props.spec.local.bucket,
      undefined,
      `The S3 bucket that this ${datasetsSingular} covers`,
    ),
  ]

  return <CardInGallery kind="datasets" name={props.metadata.name} icon={<DataSetIcon />} groups={groups} />
}
