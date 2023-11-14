import DrawerContent from "@jay/components/Drawer/Content"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"

import { singular } from "../name"
import { yamlFromSpec } from "./New/yaml"
import taskqueueProps from "./taskqueueProps"

import codeTab from "./tabs/Code"
import yamlTab from "./tabs/Yaml"
import statusTab from "./tabs/Status"

import { NewPoolButton } from "../../taskqueues/components/common"
import { taskSimulatorAction } from "../../taskqueues/components/Detail"

import type Props from "./Props"

/** Button/Action: Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      singular={singular}
      kind="applications.codeflare.dev"
      yaml={yamlFromSpec(props.application)}
      name={props.application.metadata.name}
      namespace={props.application.metadata.namespace}
    />
  )
}

/** Button/Action: Edit this resource */
function editAction(props: Props) {
  const qs = [`yaml=${encodeURIComponent(JSON.stringify(props.application))}`]
  return (
    <LinkToNewWizard key="edit" startOrAdd="edit" kind="applications" linkText="" qs={qs} size="lg" variant="plain" />
  )
}

/** Button/Action: Clone this resource */
function cloneAction(props: Props) {
  const qs = [
    `name=${props.application.metadata.name + "-copy"}`,
    `yaml=${encodeURIComponent(JSON.stringify(props.application))}`,
  ]
  return (
    <LinkToNewWizard key="clone" startOrAdd="clone" kind="applications" linkText="" qs={qs} size="lg" variant="plain" />
  )
}

/** Additional Tabs to show in the Detail view (beyond Summary and raw/Yaml) */
function otherTabs(props: Props) {
  return [codeTab(props), ...statusTab(props), ...yamlTab(props)]
}

export default function ApplicationDetail(props: Props) {
  const queueProps = taskqueueProps(props)
  const newPoolAction = !queueProps ? [] : [<NewPoolButton key="new-pool" {...queueProps} />]
  const inDemoMode = props.settings?.demoMode[0] ?? false

  const tasksim = !queueProps
    ? []
    : taskSimulatorAction(inDemoMode, queueProps.events[queueProps.events.length - 1], queueProps)

  return (
    <DrawerContent
      otherTabs={otherTabs(props)}
      actions={[...newPoolAction]}
      rightActions={[...tasksim, editAction(props), cloneAction(props), deleteAction(props)]}
    />
  )
}
