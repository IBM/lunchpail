import { Link } from "react-router-dom"

import Tiles, { type TileOptions } from "@jay/components/Forms/Tiles"

import { groupSingular as applicationsSingular } from "@jay/resources/applications/group"
import { titleSingular as applicationsDefinitionSingular } from "@jay/resources/applications/title"

import Values from "../Values"

import HelmIcon from "@patternfly/react-icons/dist/esm/icons/hard-hat-icon" // FIXME
import WandIcon from "@patternfly/react-icons/dist/esm/icons/magic-icon"
import SweepIcon from "@patternfly/react-icons/dist/esm/icons/broom-icon"
import BucketIcon from "@patternfly/react-icons/dist/esm/icons/folder-icon" // FIXME

/** Available methods for injecting Tasks */
const methods: TileOptions = [
  {
    value: "tasksimulator",
    icon: <WandIcon />,
    title: "Task Simulator",
    description: `Periodically inject valid auto-generated Tasks. This can help with testing. This requires that your ${applicationsDefinitionSingular} has included a Task Schema.`,
  },
  {
    value: "parametersweep",
    icon: <SweepIcon />,
    title: "Parameter Sweep",
    description: (
      <span>
        Run a separate Task for every point in a space of configuration parameters. You can use this kind of{" "}
        <Link
          target="_blank"
          to="https://www.mathworks.com/help/simulink/ug/optimize-estimate-and-sweep-block-parameter-values.html"
        >
          parameter sweep
        </Link>{" "}
        to determine which configuration settings give you the best outcome.
      </span>
    ),
  },
  {
    value: "bucket",
    icon: <BucketIcon />,
    title: "S3 Bucket",
    description: "Pull Tasks from a given S3 bucket.",
    isDisabled: true,
  },
  {
    value: "helm",
    icon: <HelmIcon />,
    title: "Helm Chart",
    description: "Launch a Kubernetes workload that will inject Tasks.",
  },
]

/** Method of injecting Tasks? */
export default function method(ctrl: Values) {
  return (
    <Tiles
      fieldId="method"
      label="Method of Task Injection"
      description={`How do you wish to provide Tasks to your ${applicationsSingular}?`}
      ctrl={ctrl}
      options={methods}
    />
  )
}
