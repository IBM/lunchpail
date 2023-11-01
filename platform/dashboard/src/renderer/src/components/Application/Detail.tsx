import { taskqueues } from "./Card"
import DrawerContent from "../Drawer/Content"
import DeleteResourceButton from "../DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "../DescriptionGroup"

import LinkToNewWizard from "../../navigate/wizard"

import type Props from "@jay/common/events/ApplicationSpecEvent"

/**
 * If we can find a "foo.py", then append it to the repo, so that
 * users can click to see the source directly.
 */
function repoPlusSource(props: Props) {
  const source = props.spec.command.match(/\s(\w+\.py)\s/)
  return props.spec.repo + (source ? "/" + source[1] : "")
}

/** The DescriptionList groups to show in this Detail view */
function detailGroups(props: Props) {
  return Object.entries(props.spec)
    .filter(([, value]) => value)
    .map(([term, value]) =>
      term === "repo"
        ? descriptionGroup(term, repoPlusSource(props))
        : term === "inputs"
        ? taskqueues(props)
        : typeof value !== "function" && typeof value !== "object" && descriptionGroup(term, value),
    )
}

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      kind="applications.codeflare.dev"
      uiKind="applications"
      name={props.metadata.name}
      namespace={props.metadata.namespace}
    />
  )
}

function EditApplication(props: Props) {
  const qs = [`yaml=${encodeURIComponent(JSON.stringify(props))}`]
  return <LinkToNewWizard startOrAdd="edit" kind="applications" linkText="Edit" qs={qs} />
}

function ApplicationDetail(props: Props) {
  return (
    <DrawerContent
      summary={props && <DescriptionList groups={detailGroups(props)} />}
      raw={props}
      actions={props && [<EditApplication {...props} />]}
      rightActions={props && [deleteAction(props)]}
    />
  )
}

export default function MaybeApplicationDetail(props: Props | undefined) {
  return props && <ApplicationDetail {...props} />
}
