import { Card, CardHeader, CardTitle, CardBody } from "@patternfly/react-core"

import Detail from "./Detail"

export default function ControlPlaneStatusCard() {
  return (
    <Card isLarge>
      <CardHeader>
        <CardTitle>Control Plane Status</CardTitle>
      </CardHeader>
      <CardBody>
        <Detail />
      </CardBody>
    </Card>
  )
}
