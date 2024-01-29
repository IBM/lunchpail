import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"

import { singular as job } from "./name"
import { group as data } from "@jaas/resources/datasets/group"
import { group as compute } from "@jaas/resources/workerpools/group"
import { group as workdispatch } from "@jaas/resources/workdispatchers/group"

export default (
  <span>
    To process a set of <strong>Tasks</strong>, define a <strong>{job}</strong>. Each {job} consists of four aspects:
    Code, <Link to={hash("datasets")}>{data}</Link>, {workdispatch}, and {compute}.
  </span>
)

/*       <Link to={hash("datasets")}>
      <strong>{datasets}</strong>
    </Link>{" "}
    needed to process Tasks (such as pre-trained models), a <strong>{workdispatcher}</strong> to feed Tasks to your Job,
    and one or more <strong>{workerpools}</strong> that will do the work.
*/
