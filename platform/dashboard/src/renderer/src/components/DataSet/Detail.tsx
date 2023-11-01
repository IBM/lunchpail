import S3Browser from "../S3Browser"
import DrawerContent from "../Drawer/Content"
import DeleteResourceButton from "../DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "../DescriptionGroup"

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

/** Common actions */
function rightActions(props: Props) {
  return [deleteAction(props)]
}

function otherTabs(props: Props) {
  return !window.jay.get || !window.jay.s3
    ? []
    : [
        {
          title: "Browser",
          body: <S3Browser {...props.spec.local} get={window.jay.get} s3={window.jay.s3} />,
          hasNoPadding: true,
        },
      ]
}

function DataSetDetail(props: Props) {
  return (
    <DrawerContent
      summary={props && <DescriptionList groups={detailGroups(props)} />}
      raw={props}
      otherTabs={otherTabs(props)}
      rightActions={props && rightActions(props)}
    />
  )
}

export default function MaybeDataSetDetail(props: Props | undefined) {
  return props && <DataSetDetail {...props} />
}
