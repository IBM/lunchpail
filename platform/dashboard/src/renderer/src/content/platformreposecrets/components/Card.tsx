import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import type Props from "./Props"

import Icon from "./Icon"

export default function PlatformRepoSecretCard(props: Props) {
  const { name, context } = props.metadata
  const groups = [descriptionGroup("Repo", props.spec.repo)]

  return <CardInGallery kind="platformreposecrets" name={name} context={context} icon={<Icon />} groups={groups} />
}
