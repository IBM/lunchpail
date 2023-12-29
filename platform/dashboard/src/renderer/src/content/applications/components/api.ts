import type Props from "./Props"

import { descriptionGroup } from "@jay/components/DescriptionGroup"

export default function api(props: Props) {
  const { api } = props.application.spec

  if (api === "workqueue") {
    return []
  } else {
    return [descriptionGroup("api", api, undefined, "The API used by this Application to distribute work.")]
  }
}
