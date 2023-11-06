import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import type Props from "./Props"

import Icon from "./Icon"

export default function PlatformRepoSecretCard(props: Props) {
  const name = props.metadata.name
  const groups = [descriptionGroup("Repo", props.spec.repo)]

  return <CardInGallery kind="platformreposecrets" name={name} icon={<Icon />} groups={groups} />
}
