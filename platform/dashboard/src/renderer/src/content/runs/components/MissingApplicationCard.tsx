import { useMemo } from "react"

import CardInGallery from "@jaas/components/CardInGallery"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import { singular as application } from "@jaas/resources/applications/name"

import type Props from "./Props"

export default function MissingApplicationCard(props: Pick<Props, "run">) {
  const { name, context } = props.run.metadata

  const groups = useMemo(
    () => [descriptionGroup("status", `Missing ${application} component: ${props.run.spec.application.name}`)],
    [],
  )

  return <CardInGallery kind="runs" name={name} context={context} groups={groups} />
}
