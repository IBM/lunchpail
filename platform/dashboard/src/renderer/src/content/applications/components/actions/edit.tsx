import type Props from "../Props"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"

/** Button/Action: Edit this resource */
export default function editAction(props: Props) {
  const qs = [`yaml=${encodeURIComponent(JSON.stringify(props.application))}`]
  return (
    <LinkToNewWizard key="edit" startOrAdd="edit" kind="applications" linkText="" qs={qs} size="lg" variant="plain" />
  )
}
