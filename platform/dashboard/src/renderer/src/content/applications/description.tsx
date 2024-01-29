import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"
import PopoverHelp, { type PopoverHelpProps } from "@jaas/components/PopoverHelp"

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
    To process a set of <strong>Tasks</strong>, define a <strong>{job}</strong>. Each {job} consists of four aspects:{" "}
    <>
      {aspects
        .map<import("react").ReactNode>((props) => <PopoverHelp key={props.title} {...props} />)
        .reduce((accum, elt) => [accum, <strong key="sep">|</strong>, elt])}
    </>
  </>
)

/*       <Link to={hash("datasets")}>
      <strong>{datasets}</strong>
    </Link>{" "}
    needed to process Tasks (such as pre-trained models), a <strong>{workdispatcher}</strong> to feed Tasks to your Job,
    and one or more <strong>{workerpools}</strong> that will do the work.
*/
