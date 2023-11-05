import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"

import type Props from "./Props"

import Icon from "./Icon"

export default function PlatformRepoSecretCard(props: Props) {
  const name = props.metadata.name
  const groups = [descriptionGroup("Repo", props.spec.repo)]

  return <CardInGallery kind="platformreposecrets" name={name} icon={<Icon />} groups={groups} />
}
