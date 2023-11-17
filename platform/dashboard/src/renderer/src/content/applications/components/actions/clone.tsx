import type Props from "../Props"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"

/** Button/Action: Clone this resource */
export default function cloneAction(props: Props) {
  const qs = [
    `name=${props.application.metadata.name + "-copy"}`,
    `yaml=${encodeURIComponent(JSON.stringify(props.application))}`,
  ]
  return (
    <LinkToNewWizard key="clone" startOrAdd="clone" kind="applications" linkText="" qs={qs} size="lg" variant="plain" />
  )
}
