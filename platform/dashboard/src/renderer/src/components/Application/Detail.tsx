import { datasets } from "./Card"
import DeleteButton from "../DeleteButton"
import DrawerContent from "../Drawer/Content"
import { dl, descriptionGroup } from "../DescriptionGroup"

import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

type Props = ApplicationSpecEvent

/**
 * If we can find a "foo.py", then append it to the repo, so that
 * users can click to see the source directly.
 */
function repoPlusSource(props: Props) {
  const source = props.command.match(/\s(\w+\.py)\s/)
  return props.repo + (source ? "/" + source[1] : "")
}

function detailGroups(props: Props) {
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

/** Delete this resource */
function deleteAction(props: Props) {
  return <DeleteButton kind="application.codeflare.dev" name={props.application} namespace={props.namespace} />
}

/** Common actions */
function actions(props: Props) {
  return [deleteAction(props)]
}

export default function ApplicationDetail(props: Props | undefined) {
  return <DrawerContent body={props && dl(detailGroups(props))} actions={props && actions(props)} />
}
