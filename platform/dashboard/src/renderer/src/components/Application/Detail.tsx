import { datasets } from "./Card"
import DeleteButton from "../DeleteButton"
import DrawerContent from "../Drawer/Content"
import { dl as DescriptionList, descriptionGroup } from "../DescriptionGroup"

import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

type Props = ApplicationSpecEvent

/**
 * If we can find a "foo.py", then append it to the repo, so that
 * users can click to see the source directly.
 */
function repoPlusSource(props: Props) {
  const source = props.spec.command.match(/\s(\w+\.py)\s/)
  return props.spec.repo + (source ? "/" + source[1] : "")
}

function detailGroups(props: Props) {
  return Object.entries(props.spec)
    .filter(([, value]) => value)
    .map(([term, value]) =>
      term === "repo"
        ? descriptionGroup(term, repoPlusSource(props))
        : term === "inputs"
        ? datasets(props)
        : typeof value !== "function" && typeof value !== "object" && descriptionGroup(term, value),
    )
}

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteButton kind="application.codeflare.dev" name={props.metadata.name} namespace={props.metadata.namespace} />
  )
}

/** Common actions */
function rightActions(props: Props) {
  return [deleteAction(props)]
}

export default function ApplicationDetail(props: Props | undefined) {
  return (
    <DrawerContent
      summary={props && <DescriptionList groups={detailGroups(props)} />}
      raw={props}
      rightActions={props && rightActions(props)}
    />
  )
}
