import Tiles from "@jaas/components/Forms/Tiles"
import { singular as application } from "@jaas/resources/applications/name"

import type Values from "../Values"
import type Context from "../Context"

/** A values.yaml to use with the Helm install */
const applications = (applicationOptions: NonNullable<Context["applicationOptions"]>) => (ctrl: Values) => (
  <Tiles
    fieldId="application"
    options={applicationOptions}
    label={application}
    description={`The workload to run in order to dispatch tasks to the queue, as specified by the selected ${application}`}
    ctrl={ctrl}
  />
)

/** Configuration items for a Helm-based WorkDispatcher */
export default function ApplicationConfigurationSteps({ applicationOptions }: Context) {
  return applicationOptions === null ? [] : [applications(applicationOptions)]
}

export function applicationIsValid({ application }: Values["values"], context: Context) {
  return application
    ? (true as const)
    : [
        {
          title: `Missing ${application}`,
          body: !context.applicationOptions
            ? `No ${applications} have been registered`
            : `You must specify a registered ${application}`,
          variant: "danger" as const,
        },
      ]
}
