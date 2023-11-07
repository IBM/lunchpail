import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { singular } from "./name"
import { name as datasetsName } from "../datasets/name"

export default (
  <span>
    Define your <strong>{singular}</strong> to capture what it takes to process tasks: a base image, source code,
    configuration defaults, and any <Link to={hash("datasets")}>{datasetsName}</Link> needed to process all tasks (such
    as pre-trained models).
  </span>
)
