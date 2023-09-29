import type Props from "./Props"
import { dlWithName } from "../DescriptionGroup"

import { summaryGroups } from "./Summary"

function detailGroups(props: Props) {
  // for now, the detail view shows the same content as the card summary...
  return summaryGroups(props)
}

export default function WorkerPoolDetail(props: Props | undefined) {
  return props && dlWithName(props.model.label, detailGroups(props))
}
