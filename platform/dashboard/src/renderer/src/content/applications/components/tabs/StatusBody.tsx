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

import { workdispatchersGroup } from "../workdispatchers"
import { datasetsGroup, workerpoolsGroup } from "../common"

import WorkerPoolIcon from "@jay/resources/workerpools/components/Icon"
import queueTabContent from "@jay/resources/taskqueues/components/tabs/Summary"
import correctiveLinks from "@jay/resources/workerpools/components/corrective-links"
import computeTabContent from "@jay/resources/workerpools/components/tabs/Summary"
import prettyPrintWorkerPoolName from "@jay/resources/workerpools/components/pretty-print"
import { singular as workerpoolSingular } from "@jay/resources/workerpools/name"
import type { WorkerPoolModelWithHistory } from "@jay/resources/workerpools/WorkerPoolModel"

import type Props from "../Props"

function toWorkerPoolProps(
  model: WorkerPoolModelWithHistory,
  props: Props,
): import("@jay/resources/workerpools/components/Props").default {
  return {
    model,
    taskqueueIndex: props.taskqueueIndex,
    status: props.workerpools.find((_) => model.label === _.metadata.name),
  }
}

type SBProps = {
  props: Props
  models: Props["latestWorkerPoolModels"]
  queueProps: import("@jay/resources/taskqueues/components/Props").default
}

/** Body of the Status tab of an Application detail view */
export default function StatusBody({ queueProps, props, models }: SBProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // sub-tabs, one per associated workerpool
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

  return (
    <Stack>
      <DrawerPanelBody>
        {queueTabContent(queueProps, true, [
          datasetsGroup(props),
          workdispatchersGroup(props),
          workerpoolsGroup(props, queueProps.name),
        ])}
      </DrawerPanelBody>
      {computeBody}
    </Stack>
  )
}
