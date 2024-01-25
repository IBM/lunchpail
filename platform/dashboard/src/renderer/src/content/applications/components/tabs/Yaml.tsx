import { Tabs, Tab, TabTitleText } from "@patternfly/react-core"

import DrawerTab from "@jaas/components/Drawer/Tab"
import Yaml from "@jaas/renderer/components/YamlFromObject"

import schemaTab from "./Schema"
import type Props from "../Props"

export default function yamls(props: Props) {
  const schema = schemaTab(props)
  const yaml = <Yaml obj={props.application} />

  return DrawerTab({
    title: "YAML",
    hasNoPadding: true,
    body:
      !schema || schema.length === 0 ? (
        yaml
      ) : (
        <Tabs isSecondary mountOnEnter defaultActiveKey="yaml">
          <Tab title={<TabTitleText>Resource Model</TabTitleText>} eventKey="yaml">
            {yaml}
          </Tab>

          {schema && schema.length === 1 && (
            <Tab title={<TabTitleText>Task Schema</TabTitleText>} eventKey="schema">
              {schema[0].body}
            </Tab>
          )}
        </Tabs>
      ),
  })
}
