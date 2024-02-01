import { singular as application } from "./name"
import { LinkToNewResource } from "@jaas/renderer/navigate/wizard"

export default function Actions(settings: { inDemoMode: boolean }) {
  return !settings.inDemoMode && <LinkToNewResource kind="applications" singular={application} />
}
