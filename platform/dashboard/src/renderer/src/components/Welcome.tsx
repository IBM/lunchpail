import { Bullseye, Grid, GridItem } from "@patternfly/react-core"

import ControlPlaneStatus from "./ControlPlaneStatus/Card"

export default function Welcome() {
  return (
    <Bullseye>
      <Grid>
        <GridItem>
          <ControlPlaneStatus />
        </GridItem>
      </Grid>
    </Bullseye>
  )
}
