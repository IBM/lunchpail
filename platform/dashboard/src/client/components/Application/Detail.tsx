import { datasets } from "./Card"
import { dlWithName, descriptionGroup } from "../DescriptionGroup"

import type ApplicationSpecEvent from "../../events/ApplicationSpecEvent"

/**
 * If we can find a "foo.py", then append it to the repo, so that
 * users can click to see the source directly.
 */
function repoPlusSource(props: ApplicationSpecEvent) {
  const source = props.command.match(/\s(\w+\.py)\s/)
  return props.repo + (source ? "/" + source[1] : "")
}

function detailGroups(props: ApplicationSpecEvent) {
  return Object.entries(props)
    .filter(
      ([term]) =>
        term !== "application" && term !== "timestamp" && term !== "showDetails" && term !== "currentSelection",
    )
    .filter(([, value]) => value)
    .map(([term, value]) =>
      term === "repo"
        ? descriptionGroup(term, repoPlusSource(props))
        : term === "data sets"
        ? datasets(props)
        : typeof value !== "function" && descriptionGroup(term, value),
    )
}

export default function ApplicationDetail(props: ApplicationSpecEvent | undefined) {
  return props && dlWithName(props.application, detailGroups(props))
}
