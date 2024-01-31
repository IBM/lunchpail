import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"

import { singular as run } from "@jaas/resources/runs/name"
import { singular as workdispatcher } from "@jaas/resources/workdispatchers/name"

export default (
  <span>
    A <strong>{workdispatcher}</strong> is responsible for generating <strong>Tasks</strong>. As they are generated by
    the dispatcher, tasks will be automatically posted to a managed queue that is associated with a{" "}
    <Link to={hash("runs")}>
      <strong>{run}</strong>
    </Link>
    .
  </span>
)
