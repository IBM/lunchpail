import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { Dashboard } from "./Dashboard"

import type { EventProps } from "./Dashboard"
import type NewPoolHandler from "../events/NewPoolHandler"
import type { Handler } from "../events/EventSourceLike"
import type EventSourceLike from "../events/EventSourceLike"

let props: null | EventProps<EventSourceLike> = null

const newpool: NewPoolHandler = {
  newPool: async (_, yaml) => {
    // browser apis: await fetch(`/api/newpool?yaml=${encodeURIComponent(yaml)}`)
    window.jaas.pools.create(yaml)
  },
}

class ElectronEventSource implements EventSourceLike {
  public constructor(private readonly source) {}

  /**
   * We need to keep track of the `off` function due to issues with
   * contextBridge. See
   * https://github.com/electron/electron/issues/21437#issuecomment-802288574
   */
  private off: null | (() => void) = null

  public addEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      this.off = window.jaas[this.source].on(evt, (_, model) => {
        // ugh, this is highly imperfect. currently the UI code
        // expects to be given something that looks like a
        // MessageEvent
        handler({ data: JSON.stringify(model.data) })
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
function newIfNeeded(source: "applications" | "datasets" | "pools" | "queues") {
  if (props && props[source]) {
    props[source].close()
  }

  // browser api
  // return new EventSource(`/api/${source}`, { withCredentials: true })

  // electron api
  return new ElectronEventSource(source)
}

function init(): EventProps<EventSourceLike> {
  const queues = newIfNeeded("queues")
  const datasets = newIfNeeded("datasets")
  const pools = newIfNeeded("pools")
  const applications = newIfNeeded("applications")

  const theProps = {
    datasets,
    pools,
    newpool,
    queues,
    applications,
  }
  props = theProps

  window.addEventListener("beforeunload", () => {
    queues.close()
    datasets.close()
    pools.close()
    applications.close()
  })

  return theProps
}

export default function LiveDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useSearchParams()

  return <Dashboard {...init()} location={location} navigate={navigate} searchParams={searchParams[0]} />
}
