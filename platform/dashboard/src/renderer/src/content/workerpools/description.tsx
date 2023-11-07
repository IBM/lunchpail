import { singular } from "./name"
import { name as taskqueuesName } from "../taskqueues/name"

export default (
  <span>
    The registered compute pools in your system. Each <strong>{singular}</strong> is a set of workers that can process
    tasks from one or more {taskqueuesName}.
  </span>
)
