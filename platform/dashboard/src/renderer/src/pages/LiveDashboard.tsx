import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { kinds } from "../Kind"
import { Dashboard } from "./Dashboard"

import type Kind from "../Kind"
import type { EventProps } from "./Dashboard"
import type { Handler } from "@jay/common/events/EventSourceLike"
import type EventSourceLike from "@jay/common/events/EventSourceLike"

let props: null | EventProps<EventSourceLike> = null

class ElectronEventSource implements EventSourceLike {
  public constructor(private readonly kind: Kind) {}

  /**
   * We need to keep track of the `off` function due to issues with
   * contextBridge. See
   * https://github.com/electron/electron/issues/21437#issuecomment-802288574
   */
  private off: null | (() => void) = null

  public addEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      this.off = window.jay[this.kind].on(evt, (_, model) => {
        // ugh, this is highly imperfect. currently the UI code
        // expects to be given something that looks like a
        // MessageEvent
        handler({ data: JSON.stringify(model.data) })
      })
    }
  }

  public removeEventListener(evt: "message" | "error" /*, handler: Handler*/) {
    if (evt === "message") {
      if (this.off) {
        this.off()
      }
    }
  }

  public close() {}
}

/** TODO, how do we avoid listing the fields here? Typescript fu needed */
function newIfNeeded(kind: Kind) {
  if (props && props[kind]) {
    // close prior stream for this `kind`
    props[kind].close()
  }

  // browser api
  // return new EventSource(`/api/${kind}`, { withCredentials: true })

  // electron api
  return new ElectronEventSource(kind)
}

function init(): EventProps<EventSourceLike> {
  // initialize streams, one per Kind of resource
  const streams: Record<Kind, ElectronEventSource> = kinds.reduce(
    (M, kind) => {
      M[kind] = newIfNeeded(kind)
      return M
    },
    {} as Record<Kind, ElectronEventSource>,
  )

  // make sure to close the streams before we exit
  window.addEventListener("beforeunload", () => Object.values(streams).forEach((stream) => stream.close()))

  // this memo helps us with closing prior streams on page refresh
  props = streams

  return streams
}

export default function LiveDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useSearchParams()

  return <Dashboard {...init()} location={location} navigate={navigate} searchParams={searchParams[0]} />
}
