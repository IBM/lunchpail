import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"

import { singular as run } from "@jaas/resources/runs/name"
import { name as code } from "@jaas/resources/applications/name"
import { name as data } from "@jaas/resources/datasets/name"
import { singular as workerpool } from "@jaas/resources/workerpools/name"

export default (
  <>
    Your {run}'s <strong>{code}</strong> is used by <strong>Workers</strong> in a <strong>{workerpool}</strong> to
    process <strong>Tasks</strong>. It may include required bindings to{" "}
    <Link to={hash("datasets")}>
      <strong>{data}</strong>
    </Link>
    , e.g. if it needs access to a <i>global</i> set of data in order to process the data of each Task.
  </>
)
