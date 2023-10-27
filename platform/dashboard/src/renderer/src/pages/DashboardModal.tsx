import { lazy, Suspense } from "react"
import { Modal } from "@patternfly/react-core"

import type Kind from "../Kind"
import { isShowingWizard } from "../navigate/wizard"
import { returnHomeCallback, returnToWorkerPoolsCallback } from "../navigate/home"

import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

const NewWorkerPoolWizard = lazy(() => import("../components/WorkerPool/New/Wizard"))
const NewApplicationWizard = lazy(() => import("../components/Application/New/Wizard"))
const NewRepoSecretWizard = lazy(() => import("../components/PlatformRepoSecret/New/Wizard"))

type Props = {
  applications: ApplicationSpecEvent[]
  datasets: string[]
}

function Wizard(props: Props & { kind: Kind }) {
  const returnHome = returnHomeCallback()
  const returnToWorkerPools = returnToWorkerPoolsCallback()

  switch (props.kind) {
    case "workerpools":
      return (
        <NewWorkerPoolWizard
          onSuccess={returnToWorkerPools}
          onCancel={returnHome}
          applications={props.applications}
          datasets={props.datasets}
        />
      )
    case "platformreposecrets":
      return <NewRepoSecretWizard onSuccess={returnHome} onCancel={returnHome} />

    case "applications":
      return <NewApplicationWizard onSuccess={returnHome} onCancel={returnHome} />

    default:
      console.error("Internal error: Wizard modal opened to unsupported resource kind", props.kind)
      return <div tabIndex={0}>Internal Error: Unsupported Wizard for {props.kind}</div>
  }
}

export default function DashboardModal(props: Props) {
  const returnHome = returnHomeCallback()

  // kind will be non-null if we are currently showing a wizard
  const kind = isShowingWizard()

  // currently, the only modal we show is the wizard
  const isOpen = !!kind

  return (
    <Suspense fallback={<></>}>
      <Modal
        variant="large"
        showClose={false}
        hasNoBodyWrapper
        aria-label="wizard-modal"
        onEscapePress={returnHome}
        isOpen={isOpen}
      >
        {kind ? <Wizard kind={kind} {...props} /> : <></>}
      </Modal>
    </Suspense>
  )
}
