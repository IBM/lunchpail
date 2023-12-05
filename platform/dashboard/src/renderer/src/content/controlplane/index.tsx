import { Link } from "react-router-dom"

import JobManagerCard from "./components/Card"
import JobManagerDetail from "./components/Detail"

import { hash } from "@jay/renderer/navigate/kind"
import { name as productName } from "../../../../../package.json"

import { name, singular } from "./name"

import type ContentProvider from "../ContentProvider"

function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1)
}

/** ControlPlane ContentProvider */
const controlplane: ContentProvider<"controlplane"> = {
  kind: "controlplane",

  name,

  singular,

  isInSidebar: "Advanced",

  description: (
    <span>
      <strong>{capitalize(productName)}</strong> helps you to manage your Jobs: pick Data to analyze, and then assign{" "}
      <Link to={hash("workerpools")}>Workers</Link> to process the tasks in a selected set of data.
    </span>
  ),

  gallery: () => <JobManagerCard />,

  detail: () => ({ body: <JobManagerDetail /> }),
}

export default controlplane
