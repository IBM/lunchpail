import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { singular } from "./name"
import { name as datasetsName } from "../datasets/name"

export default (
  <span>
    <strong>{singular}</strong> captures what it takes to process <strong>Tasks</strong>: a base image, source code,
    configuration defaults, a Task Queue, and any{" "}
    <Link to={hash("datasets")}>
      <strong>{datasetsName}</strong>
    </Link>{" "}
    needed to process all Tasks (such as pre-trained models).
  </span>
)
