import { useLocation, useSearchParams } from "react-router-dom"

import {
  Alert,
  AlertActionLink,
  Badge,
  DrawerPanelBody,
  Stack,
  Tabs,
  Tab,
  TabAction,
  TabTitleIcon,
  TabTitleText,
} from "@patternfly/react-core"

import { datasetsGroup, workerpoolsGroup } from "../Card"
import taskqueueProps from "../taskqueueProps"
import WorkerPoolIcon from "../../../workerpools/components/Icon"
import prettyPrintWorkerPoolName from "../../../workerpools/components/pretty-print"
import { summaryTabContent as queueTabContent } from "../../../taskqueues/components/Detail"
import { singular as workerpoolSingular } from "../../../workerpools/name"
import { correctiveLinks, summaryTabContent as computeTabContent } from "../../../workerpools/components/Detail"

import type Props from "../Props"

import type { WorkerPoolModelWithHistory } from "../../../workerpools/WorkerPoolModel"
function toWorkerPoolProps(
  model: WorkerPoolModelWithHistory,
  props: Props,
): import("../../../workerpools/components/Props").default {
  return {
    model,
    taskqueueIndex: props.taskqueueIndex,
    status: props.workerpools.find((_) => model.label === _.metadata.name),
  }
}

/** Tab that shows Status of tasks and compute */
export default function statusTab(props: Props) {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const queueProps = taskqueueProps(props)
  const models = props.latestWorkerPoolModels.filter((_) => _.application === props.application.metadata.name)
  if (!queueProps) {
    return []
  }

  const computeBody =
    models.length === 0 ? (
      <></>
    ) : (
      <Tabs isSecondary mountOnEnter defaultActiveKey={models[0].label}>
        {models.map((model) => {
          const workerpoolProps = toWorkerPoolProps(model, props)

          const corrections = correctiveLinks({ location, searchParams }, workerpoolProps)
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
              {computeTabContent(workerpoolProps, true)}
            </Stack>
          )

          return (
            <Tab
              key={model.label}
              title={
                <>
                  <TabTitleIcon>
                    <WorkerPoolIcon />
                  </TabTitleIcon>
                  <TabTitleText>{prettyPrintWorkerPoolName(model.label, queueProps.name)}</TabTitleText>
                </>
              }
              eventKey={model.label}
            >
              <DrawerPanelBody>{tabBody}</DrawerPanelBody>
            </Tab>
          )
        })}
      </Tabs>
    )

  const body = (
    <Stack>
      <DrawerPanelBody>
        {queueTabContent(queueProps, true, [datasetsGroup(props), workerpoolsGroup(props, queueProps.name)])}
      </DrawerPanelBody>
      {computeBody}
    </Stack>
  )

  return [
    {
      title: "Status",
      body,
      hasNoPadding: true,
      actions: (
        <TabAction>
          <Badge isRead={models.length === 0}>{pluralize("worker", models.length)}</Badge>
        </TabAction>
      ),
    },
  ]
}

function pluralize(text: string, value: number) {
  return `${value} ${text}${value !== 1 ? "s" : ""}`
}
