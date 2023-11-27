import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { titleSingular } from "./title"
import { name as datasetsName } from "@jay/resources/datasets/name"
import { singular as workdispatchersName } from "@jay/resources/workdispatchers/name"

export default (
  <span>
    A <strong>{titleSingular}</strong> captures what it takes to process <strong>Tasks</strong>: a base image, source
    code, configuration defaults, any{" "}
    <Link to={hash("datasets")}>
      <strong>{datasetsName}</strong>
    </Link>{" "}
    needed to process Tasks (such as pre-trained models), and{" "}
    <Link to={hash("workdispatchers")}>{workdispatchersName}</Link> to feed Tasks to your Job.
  </span>
)
