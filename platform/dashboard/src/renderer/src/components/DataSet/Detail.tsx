import { BrowserTabs } from "../S3Browser"
import DrawerContent from "../Drawer/Content"
import DeleteResourceButton from "../DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "../DescriptionGroup"

import LinkToNewWizard from "../../navigate/wizard"

import type Props from "./Props"

function detailGroups(props: Props) {
  return Object.entries(props.spec.local)
    .filter(([, value]) => value)
    .map(([term, value]) => typeof value !== "function" && typeof value !== "object" && descriptionGroup(term, value))
}

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      kind="dataset"
      uiKind="datasets"
      name={props.metadata.name}
      namespace={props.metadata.namespace}
    />
  )
}

function Edit(props: Props) {
  const qs = [`action=edit&yaml=${encodeURIComponent(JSON.stringify(props))}`]
  return <LinkToNewWizard startOrAdd="edit" kind="datasets" linkText="Edit" qs={qs} />
}

/** Tabs specific to this kind of data */
function otherTabs(props: Props) {
  return BrowserTabs(props.spec.local)
}

export default function DataSetDetail(props: Props) {
  return (
    <DrawerContent
      summary={props && <DescriptionList groups={detailGroups(props)} />}
      raw={props}
      actions={props && [<Edit {...props} />]}
      rightActions={props && [deleteAction(props)]}
      otherTabs={otherTabs(props)}
    />
  )
}
