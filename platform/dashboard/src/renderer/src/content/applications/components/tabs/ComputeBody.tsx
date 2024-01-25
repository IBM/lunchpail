import { useLocation, useSearchParams } from "react-router-dom"

import {
  Alert,
  AlertActionLink,
  DrawerPanelBody,
  Stack,
  Tabs,
  Tab,
  TabTitleIcon,
  TabTitleText,
} from "@patternfly/react-core"

import WorkerPoolIcon from "@jaas/resources/workerpools/components/Icon"
import correctiveLinks from "@jaas/resources/workerpools/components/corrective-links"
import computeTabContent from "@jaas/resources/workerpools/components/tabs/Summary"
import prettyPrintWorkerPoolName from "@jaas/resources/workerpools/components/pretty-print"
import { singular as workerpoolSingular } from "@jaas/resources/workerpools/name"
import type { WorkerPoolModelWithHistory } from "@jaas/resources/workerpools/WorkerPoolModel"

import type Props from "../Props"

function toWorkerPoolProps(
  model: WorkerPoolModelWithHistory,
  props: Props,
): import("@jaas/resources/workerpools/components/Props").default {
  return {
    model,
    taskqueueIndex: props.taskqueueIndex,
    status: props.workerpools.find((_) => model.label === _.metadata.name),
  }
}

type ComputeBodyProps = {
  props: Props
  models: Props["latestWorkerPoolModels"]
  queueProps: import("@jaas/resources/taskqueues/components/Props").default
}

/** Body of the Status tab of an Application detail view */
export default function ComputeBody({ queueProps, props, models }: ComputeBodyProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // sub-tabs, one per associated workerpool
  const computeBody =
    models.length === 0 ? (
      <DrawerPanelBody>No Workers Assigned</DrawerPanelBody>
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

  return computeBody
}
