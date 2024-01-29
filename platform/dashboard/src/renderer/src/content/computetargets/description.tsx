import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"

import { name as productName } from "../../../../../package.json"

function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1)
}

export default (
  <>
    <strong>{capitalize(productName)}</strong> helps you to manage your Jobs: pick Data to analyze, and then assign{" "}
    <Link to={hash("workerpools")}>Workers</Link> to process the tasks in a selected set of data.
  </>
)
