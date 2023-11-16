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

import { datasetsGroup, workerpoolsGroup } from "../common"
import WorkerPoolIcon from "../../../workerpools/components/Icon"
import queueTabContent from "../../../taskqueues/components/tabs/Summary"
import { singular as workerpoolSingular } from "../../../workerpools/name"
import computeTabContent from "../../../workerpools/components/tabs/Summary"
import correctiveLinks from "../../../workerpools/components/corrective-links"
import prettyPrintWorkerPoolName from "../../../workerpools/components/pretty-print"

import type { WorkerPoolModelWithHistory } from "../../../workerpools/WorkerPoolModel"

import type Props from "../Props"

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

type SBProps = {
  props: Props
  models: Props["latestWorkerPoolModels"]
  queueProps: import("../../../taskqueues/components/Props").default
}

export default function StatusBody({ queueProps, props, models }: SBProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()

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
        {queueTabContent(queueProps, true, [datasetsGroup(props), workerpoolsGroup(props, queueProps.name)])}
      </DrawerPanelBody>
      {computeBody}
    </Stack>
  )
}
