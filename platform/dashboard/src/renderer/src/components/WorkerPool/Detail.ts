import type Props from "./Props"
import { dl, descriptionGroup } from "../DescriptionGroup"

import { actions, summaryGroups } from "./Summary"

function detailGroups(props: Props) {
  return [actions(props).actions.map((action) => [descriptionGroup(action.key, action)]), ...summaryGroups(props)]
}

export default function WorkerPoolDetail(props: Props | undefined) {
  return props && dl(detailGroups(props))
}
