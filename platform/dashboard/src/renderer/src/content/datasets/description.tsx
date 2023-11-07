import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { name as applicationsName } from "../applications/name"

export default (
  <span>
    Each <strong>Dataset</strong> resource stores extra data needed by{" "}
    <Link to={hash("applications")}>{applicationsName}</Link>, beyond that which is provided by an input Task. For
    example: a pre-trained model or a chip design that is being tested across multiple configurations.
  </span>
)
