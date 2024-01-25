import CardInGallery from "@jaas/components/CardInGallery"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import { singular as datasetsSingular } from "@jaas/resources/datasets/name"

import type DataSetEvent from "@jaas/common/events/DataSetEvent"

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

  const { name, context } = props.metadata
  return <CardInGallery kind="datasets" name={name} context={context} icon={<DataSetIcon />} groups={groups} />
}
