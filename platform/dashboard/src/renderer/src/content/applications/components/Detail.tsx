import { useLocation, useSearchParams } from "react-router-dom"
import { Alert, AlertActionLink, DrawerPanelBody, Stack, Tabs, Tab, TabTitleText, Text } from "@patternfly/react-core"

import Yaml from "@jay/components/YamlFromObject"
import DrawerContent from "@jay/components/Drawer/Content"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

import { singular } from "../name"
import { yamlFromSpec } from "./New/yaml"
import { api, datasetsGroup, taskqueues } from "./Card"

import { NewPoolButton } from "../../taskqueues/components/common"
import { singular as workerpoolSingular } from "../../workerpools/name"
import { correctiveLinks, summaryTabContent as computeTabContent } from "../../workerpools/components/Detail"
import { summaryTabContent as queueTabContent, taskSimulatorAction } from "../../taskqueues/components/Detail"

import { type DetailProps as Props } from "./Props"

/**
 * If we can find a "foo.py", then append it to the repo, so that
 * users can click to see the source directly.
 */
function repoPlusSource(props: Props) {
  const source = props.application.spec.command.match(/\s(\w+\.py)\s/)
  return props.application.spec.repo + (source ? "/" + source[1] : "")
}

/** The DescriptionList groups to show in this Detail view */
function detailGroups(props: Props) {
  const { spec } = props.application

  return [
    ...api(props),
    descriptionGroup("description", spec.description),
    datasetsGroup(props),
    descriptionGroup("command", <Text component="pre">{spec.command}</Text>),
    descriptionGroup("image", spec.image),
    descriptionGroup("repo", repoPlusSource(props)),
    descriptionGroup("Supports Gpu?", spec.supportsGpu),
  ]
}

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

/** Tab that shows the Task Schema of this Application */
function taskSchemaTab(props: Props) {
  const { inputs } = props.application.spec

  return inputs && inputs.length > 0 && typeof inputs[0].schema === "object"
    ? [
        {
          title: "Schema",
          body: <Yaml showLineNumbers={false} obj={JSON.parse(inputs[0].schema.json)} />,
          hasNoPadding: true,
        },
      ]
    : []
}

function taskqueueProps(props: Props): undefined | import("../../taskqueues/components/Props").default {
  const queues = taskqueues(props)

  return queues.length === 0
    ? undefined
    : {
        name: queues[0],
        idx: props.taskqueueIndex[queues[0]],
        events: props.taskqueues.filter((_) => _.metadata.name === queues[0]),
        applications: [props.application],
        workerpools: props.workerpools,
        tasksimulators: props.tasksimulators,
        taskqueueIndex: props.taskqueueIndex,
        settings: props.settings,
      }
}

/** Tab that shows Queues */
function queuesTab(props: Props) {
  const queueProps = taskqueueProps(props)

  return !queueProps
    ? []
    : [
        {
          title: "Queue",
          body: queueTabContent(queueProps, true),
        },
      ]
}

/** Tab that shows Compute */
function computeTab(props: Props) {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const models = props.latestWorkerPoolModels.filter((_) => _.application === props.application.metadata.name)
  if (models.length === 0) {
    return []
  }

  const body = (
    <Tabs isSecondary mountOnEnter defaultActiveKey={models[0].label}>
      {models.map((model) => {
        const model0 = {
          model,
          taskqueueIndex: props.taskqueueIndex,
          status: props.workerpools.find((_) => models[0].label === _.metadata.name),
        }

        const corrections = correctiveLinks({ location, searchParams }, model0)
        const tabBody = (
          <Stack hasGutter>
            {corrections.length > 0 && (
              <Alert
                isInline
                variant="danger"
                title={`Unhealthy ${workerpoolSingular}`}
                actionLinks={corrections.map((_) => (
                  <AlertActionLink {..._} />
                ))}
              >
                This {workerpoolSingular} is unhealthy. Consider taking the suggested corrective action
                {corrections.length === 1 ? "" : "s"}.
              </Alert>
            )}
            {computeTabContent(model0, true)}
          </Stack>
        )

        return (
          <Tab
            key={model.label}
            title={
              <TabTitleText>
                {model.label.replace(props.application.metadata.name.replace(/-/, "") + "-pool-", "")}
              </TabTitleText>
            }
            eventKey={model.label}
          >
            <DrawerPanelBody>{tabBody}</DrawerPanelBody>
          </Tab>
        )
      })}
    </Tabs>
  )

  return [
    {
      title: "Compute",
      body,
      hasNoPadding: true,
    },
  ]
}

function codeTab(props: Props) {
  return { title: singular, body: <DescriptionList groups={detailGroups(props)} /> }
}

/** Additional Tabs to show in the Detail view (beyond Summary and raw/Yaml) */
function otherTabs(props: Props) {
  return [codeTab(props), ...queuesTab(props), ...computeTab(props), ...taskSchemaTab(props)]
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
      raw={props.application}
      otherTabs={otherTabs(props)}
      actions={[...newPoolAction]}
      rightActions={[...tasksim, editAction(props), cloneAction(props), deleteAction(props)]}
    />
  )
}
