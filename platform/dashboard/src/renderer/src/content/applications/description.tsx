import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { titleSingular } from "./title"
import { name as datasetsName } from "../datasets/name"

export default (
  <span>
    A <strong>{titleSingular}</strong> captures what it takes to process <strong>Tasks</strong>: a base image, source
    code, configuration defaults, a Task Queue, and any{" "}
    <Link to={hash("datasets")}>
      <strong>{datasetsName}</strong>
    </Link>{" "}
    needed to process all Tasks (such as pre-trained models).
  </span>
)
