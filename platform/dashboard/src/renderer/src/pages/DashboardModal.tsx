import { createElement, lazy, Suspense } from "react"
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
  taskqueues: string[]
}

function Wizard(props: Props & { kind: Kind }) {
  const returnHome = returnHomeCallback()
  const returnToWorkerPools = returnToWorkerPoolsCallback()

  const { kind } = props
  const WizardComponent =
    kind === "workerpools"
      ? NewWorkerPoolWizard
      : kind === "platformreposecrets"
      ? NewRepoSecretWizard
      : kind === "applications"
      ? NewApplicationWizard
      : undefined

  if (!WizardComponent) {
    console.error("Internal error: Wizard modal opened to unsupported resource kind", props.kind)
    return <div tabIndex={0}>Internal Error: Unsupported Wizard for {props.kind}</div>
  } else {
    return createElement(
      WizardComponent,
      Object.assign(
        {},
        {
          onCancel: returnHome,
          onSuccess: returnToWorkerPools,
        },
        props,
      ),
    )
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
