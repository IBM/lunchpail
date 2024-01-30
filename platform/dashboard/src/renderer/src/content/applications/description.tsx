import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"

import { name as code } from "@jaas/resources/applications/name"
import { singular as data } from "@jaas/resources/datasets/name"
import { singular as workerpool } from "@jaas/resources/workerpools/name"

export default (
  <>
    Your Job's <strong>{code}</strong> is the application logic that is used by <strong>Workers</strong> in a{" "}
    <strong>{workerpool}</strong> to process <strong>Tasks</strong>. It may optionally include required bindings to{" "}
    <Link to={hash("datasets")}>
      <strong>{data}</strong>
    </Link>
    , e.g. if your {code}
    needs access to models in order to process any given Task.
  </>
)
