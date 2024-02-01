import { singular as run } from "./name"
import { LinkToNewResource } from "@jaas/renderer/navigate/wizard"

export default function Actions(settings: { inDemoMode: boolean }) {
  return !settings.inDemoMode && <LinkToNewResource kind="runs" singular={run} />
}
