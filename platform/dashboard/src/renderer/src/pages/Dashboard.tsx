import { useContext, useEffect, lazy, Suspense } from "react"

const Modal = lazy(() => import("@patternfly/react-core").then((_) => ({ default: _.Modal })))

import { currentKind } from "../navigate/kind"
import { isShowingWizard } from "../navigate/wizard"
import { returnHomeCallback } from "../navigate/home"

import PageWithDrawer, { drilldownProps } from "./PageWithDrawer"

import Settings from "../Settings"
import Sidebar from "../sidebar"
import Gallery from "../components/Gallery"

import initState from "../content/state"
import content from "../content/providers"
import { initMemos } from "../content/memos"

import type WatchedKind from "@jay/common/Kind"
import type EventSourceLike from "@jay/common/events/EventSourceLike"

import "./Dashboard.scss"

/** one EventSource per resource Kind */
export type Props<Source extends EventSourceLike = EventSourceLike> = Record<WatchedKind, Source>

export function Dashboard(props: Props) {
  const settings = useContext(Settings)
  const inDemoMode = settings?.demoMode[0] ?? false

  const returnHome = returnHomeCallback()

  const { events, handlers } = initState()
  const memos = initMemos(events)

  // This registers what is in effect a componentDidMount handler. We
  // use it to register/deregister our event `handlers`
  useEffect(function onMount() {
    Object.entries(handlers).forEach(([kind, handler]) => {
      props[kind].addEventListener("message", handler, false)
    })

    // return a cleanup function to be called when the component unmounts
    return () =>
      Object.entries(handlers).forEach(([kind, handler]) => props[kind].removeEventListener("message", handler))
  }, [])

  /** Content to display in the slide-out Drawer panel */
  const { currentlySelectedId: id, currentlySelectedKind: kind } = drilldownProps()
  const detailContentProvider = id && kind && content[kind]
  const currentDetail =
    detailContentProvider && detailContentProvider.detail ? detailContentProvider.detail(id, events, memos) : undefined

  /** Content to display in the main gallery */
  const bodyContentProvider = content[currentKind()]
  const currentActions =
    bodyContentProvider && bodyContentProvider.actions ? bodyContentProvider.actions({ inDemoMode }) : undefined

  /** Content to display in the modal */
  const kindForWizard = isShowingWizard()
  const wizardContentProvider = !!kindForWizard && content[kindForWizard]
  const modal = (
    <Suspense fallback={<></>}>
      <Modal
        variant="large"
        showClose={false}
        hasNoBodyWrapper
        aria-label="wizard-modal"
        onEscapePress={returnHome}
        isOpen={!!wizardContentProvider}
      >
        {wizardContentProvider && wizardContentProvider.wizard ? wizardContentProvider.wizard(events) : undefined}
      </Modal>
    </Suspense>
  )

  /** Content to display in the hamburger-menu sidebar (usually coming in on the left) */
  const sidebar = (
    <Sidebar
      datasets={events.datasets.length}
      workerpools={events.workerpools.length}
      applications={events.applications.length}
      platformreposecrets={events.platformreposecrets.length}
    />
  )

  const pwdProps = {
    currentDetail,
    modal,
    title: bodyContentProvider.name,
    subtitle: bodyContentProvider.description,
    sidebar,
    actions: currentActions,
  }

  return (
    <PageWithDrawer {...pwdProps}>
      <Gallery>{bodyContentProvider.gallery && bodyContentProvider.gallery(events, memos)}</Gallery>
    </PageWithDrawer>
  )
}
