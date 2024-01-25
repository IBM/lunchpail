import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"

import { name as job } from "./name"
import { name as datasets } from "@jaas/resources/datasets/name"
import { name as workerpools } from "@jaas/resources/workerpools/name"
import { singular as workdispatcher } from "@jaas/resources/workdispatchers/name"

export default (
  <span>
    A <strong>{job}</strong> defines how to process <strong>Tasks</strong>:<strong>Code</strong>, configuration
    defaults,{" "}
    <Link to={hash("datasets")}>
      <strong>{datasets}</strong>
    </Link>{" "}
    needed to process Tasks (such as pre-trained models), a <strong>{workdispatcher}</strong> to feed Tasks to your Job,
    and one or more <strong>{workerpools}</strong> that will do the work.
  </span>
)
