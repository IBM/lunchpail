import { singular } from "./name"
import { name as taskqueuesName } from "../taskqueues/name"

export default (
  <span>
    Each <strong>{singular}</strong> has a base image, a code repository, and some configuration defaults. Each may
    define one or more compatible {taskqueuesName}.
  </span>
)
