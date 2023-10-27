import { lazy, Suspense } from "react"
import { Modal } from "@patternfly/react-core"

import isShowingNewPool from "../navigate/newpool"
import { isShowingWizard } from "../navigate/wizard"
import { returnHomeCallback, returnToWorkerPoolsCallback } from "../navigate/home"

import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

const NewWorkerPoolWizard = lazy(() => import("../components/WorkerPool/New/Wizard"))
const NewRepoSecretWizard = lazy(() => import("../components/PlatformRepoSecret/New/Wizard"))

type Props = {
  applications: ApplicationSpecEvent[]
  datasets: string[]
}

export default function DashboardModal(props: Props) {
  const returnHome = returnHomeCallback()
  const returnToWorkerPools = returnToWorkerPoolsCallback()

  return (
    <Suspense fallback={<></>}>
      <Modal
        variant="large"
        showClose={false}
        hasNoBodyWrapper
        aria-label="wizard-modal"
        onEscapePress={returnHome}
        isOpen={isShowingWizard()}
      >
        {isShowingNewPool() ? (
          <NewWorkerPoolWizard
            onSuccess={returnToWorkerPools}
            onCancel={returnHome}
            applications={props.applications}
            datasets={props.datasets}
          />
        ) : (
          <NewRepoSecretWizard onSuccess={returnToWorkerPools} onCancel={returnHome} />
        )}
      </Modal>
    </Suspense>
  )
}
