import { name as dispatchers } from "@jaas/resources/workdispatchers/name"
import { singular as taskqueue } from "@jaas/resources/taskqueues/name"

export default (
  <>
    A {taskqueue} is a buffer between {dispatchers} and Workers.
  </>
)
