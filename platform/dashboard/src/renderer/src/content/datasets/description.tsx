import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { singular } from "./name"
import { name as applicationsName } from "../applications/name"

export default (
  <span>
    Each <strong>{singular}</strong> resource stores extra data needed by{" "}
    <Link to={hash("applications")}>
      <strong>{applicationsName}</strong>
    </Link>
    , beyond that which is provided by an input <strong>Task</strong>. For example: a pre-trained model or a chip design
    that is being tested across multiple configurations.
  </span>
)
