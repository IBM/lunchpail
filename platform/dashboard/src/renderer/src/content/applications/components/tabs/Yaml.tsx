import { Tabs, Tab, TabTitleText } from "@patternfly/react-core"

import Yaml from "@jay/renderer/components/YamlFromObject"

import schemaTab from "./Schema"
import type Props from "../Props"

export default function yamls(props: Props) {
  const schema = schemaTab(props)
  const yaml = <Yaml obj={props.application} />

  return [
    {
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
    },
  ]
}
