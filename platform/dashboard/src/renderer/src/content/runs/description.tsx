import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"
import PopoverHelp, { type PopoverHelpProps } from "@jaas/components/PopoverHelp"

import { Component } from "@jaas/resources/sidebar-groups"

import { singular as job } from "./name"

import codeDesc from "@jaas/resources/applications/description"
import { group as code } from "@jaas/resources/applications/group"
import { name as applications } from "@jaas/resources/applications/name"

import dataDesc from "@jaas/resources/datasets/description"
import { name as data } from "@jaas/resources/datasets/name"

import computeDesc from "@jaas/resources/workerpools/description"
import { group as compute } from "@jaas/resources/workerpools/group"
import { name as workerpools } from "@jaas/resources/workerpools/name"
import { name as workdispatchers } from "@jaas/resources/workdispatchers/name"

import dispatchDesc from "@jaas/resources/workdispatchers/description"
import { group as workdispatch } from "@jaas/resources/workdispatchers/group"

const aspects: PopoverHelpProps[] = [
  { title: code, children: codeDesc, footer: <Link to={hash("applications")}>Show all {applications}</Link> },
  { title: data, children: dataDesc, footer: <Link to={hash("datasets")}>Show all {data}</Link> },
  {
    title: workdispatch,
    children: dispatchDesc,
    footer: <Link to={hash("workdispatchers")}>Show all {workdispatchers}</Link>,
  },
  { title: compute, children: computeDesc, footer: <Link to={hash("workerpools")}>Show all {workerpools}</Link> },
]

export default (
  <>
    A <strong>{job}</strong> is responsible for processing a set of <strong>Tasks</strong>. Each {job} consists of four{" "}
    <strong>{Component}</strong>:
    <>
      {aspects
        .map<import("react").ReactNode>((props) => <PopoverHelp key={props.title} {...props} />)
        .reduce((accum, elt) => [accum, <strong key="sep">|</strong>, elt])}
    </>
  </>
)
