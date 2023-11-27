import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { singular } from "./name"
import { group as applicationsName } from "@jay/resources/applications/group"

export default (
  <span>
    Each <strong>{singular}</strong> resource stores data needed by{" "}
    <Link to={hash("applications")}>
      <strong>{applicationsName}</strong>
    </Link>
    , such as a pre-trained model, or a chip design that is being tested across multiple configurations, or a
    pre-arranged "drop box" for Tasks to be processed.
  </span>
)
