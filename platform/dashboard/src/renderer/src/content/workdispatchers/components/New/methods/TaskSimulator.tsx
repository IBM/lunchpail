import Select from "@jay/components/Forms/Select"
import TextArea from "@jay/components/Forms/TextArea"
import NumberInput from "@jay/components/Forms/NumberInput"

import { singular } from "@jay/resources/workdispatchers/name"
import { groupSingular as applicationsSingular } from "@jay/resources/applications/group"

import Values from "../Values"

const nTasks = (ctrl: Values) => (
  <NumberInput
    fieldId="tasks"
    label="Number of Tasks"
    description="Every interval, the simulator will inject this many Tasks"
    min={1}
    defaultValue={parseInt(ctrl.values.tasks, 10)}
    ctrl={ctrl}
  />
)

const injectionInterval = (ctrl: Values) => (
  <NumberInput
    fieldId="intervalSeconds"
    label="Injection Interval"
    labelInfo="Specified in seconds"
    description="The interval between Task injections"
    min={1}
    defaultValue={parseInt(ctrl.values.intervalSeconds, 10)}
    ctrl={ctrl}
  />
)

const inputFormat = (ctrl: Values) => (
  <Select
    fieldId="inputFormat"
    label="Input Format"
    description={`Choose the file format that your ${applicationsSingular} accepts`}
    ctrl={ctrl}
    options={[
      {
        value: "Parquet",
        description:
          "Apache Parquet is an open source, column-oriented data file format designed for efficient data storage and retrieval. It provides efficient data compression and encoding schemes with enhanced performance to handle complex data in bulk.",
      },
    ]}
  />
)

const inputSchema = (ctrl: Values) => (
  <TextArea
    fieldId="inputSchema"
    label="Input Schema"
    description={`The JSON schema of the Tasks accepted by your ${singular}`}
    ctrl={ctrl}
    language="json"
    rows={12}
  />
)

/** Configuration items for a TaskSimulator-based WorkDispatcher */
export default [nTasks, injectionInterval, inputFormat, inputSchema]
