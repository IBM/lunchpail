import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"
import PopoverHelp, { type PopoverHelpProps } from "@jaas/components/PopoverHelp"

import { componentsSidebar } from "@jaas/resources/sidebar-groups"

import { singular as job } from "./name"

import dataDesc from "@jaas/resources/datasets/description"
import { name as data } from "@jaas/resources/datasets/name"

import computeDesc from "@jaas/resources/workerpools/description"
import { group as compute } from "@jaas/resources/workerpools/group"
import { singular as workerpool } from "@jaas/resources/workerpools/name"

import dispatchDesc from "@jaas/resources/workdispatchers/description"
import { group as workdispatch } from "@jaas/resources/workdispatchers/group"

/** TODO we need to separate out Applications vs Code? */
const codeDesc = (
  <>
    <strong>Code</strong> is the application logic that is used by <strong>Workers</strong> in a{" "}
    <strong>{workerpool}</strong> to process <strong>Tasks</strong>.
  </>
)

const aspects: PopoverHelpProps[] = [
  { title: "Code", children: codeDesc },
  { title: data, children: dataDesc, footer: <Link to={hash("datasets")}>Show all {data}</Link> },
  { title: workdispatch, children: dispatchDesc },
  { title: compute, children: computeDesc },
]

export default (
  <>
    A <strong>{job}</strong> is responsible for processing a set of <strong>Tasks</strong>. Each {job} consists of four{" "}
    <strong>{componentsSidebar.group}</strong>:
    <>
      {aspects
        .map<import("react").ReactNode>((props) => <PopoverHelp key={props.title} {...props} />)
        .reduce((accum, elt) => [accum, <strong key="sep">|</strong>, elt])}
    </>
  </>
)
