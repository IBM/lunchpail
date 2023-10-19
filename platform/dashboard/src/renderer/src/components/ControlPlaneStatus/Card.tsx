import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@patternfly/react-core"

import Detail from "./Detail"

function header() {
  return (
    <CardHeader>
      <CardTitle>Control Plane Status</CardTitle>
    </CardHeader>
  )
}

function body() {
  return (
    <CardBody>
      <Detail />
    </CardBody>
  )
}

function footer() {
  return <CardFooter></CardFooter>
}

export default function ControlPlaneStatusCard() {
  return (
    <Card isLarge>
      {header()}
      {body()}
      {footer()}
    </Card>
  )
}
