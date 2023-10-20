import type { PropsWithChildren } from "react"
import { Gallery } from "@patternfly/react-core"

import { resourceNames } from "../names"
import ControlPlaneStatus from "./ControlPlaneStatus/Card"

import { Card, CardBody, CardHeader, CardTitle, Title } from "@patternfly/react-core"
function CountCard(props: PropsWithChildren<{ count: number }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.children}</CardTitle>
      </CardHeader>
      <CardBody>
        <Title headingLevel="h1">{props.count}</Title>
      </CardBody>
    </Card>
  )
}

const width = { default: "35em" as const }

type Props = {
  appMd5: string
  applications: string[]
  datasets: string[]
  workerpools: string[]
}

export default function Welcome(props: Props) {
  return (
    <Gallery hasGutter minWidths={width} maxWidths={width}>
      <ControlPlaneStatus />
      {Object.entries(resourceNames).map(([kind, name]) => (
        <CountCard count={props[kind]?.length || 0}>{name}</CountCard>
      ))}
    </Gallery>
  )
}
