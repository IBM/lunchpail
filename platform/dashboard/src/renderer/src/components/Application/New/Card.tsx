import NewCard from "../../NewCard"
import { singular } from "../../../names"
import LinkToNewWizard from "../../../navigate/wizard"

type Props = {
  namespace?: string
}

function LinkToNewApplication(props: Props) {
  const qs: string[] = []
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }
  return (
    <LinkToNewWizard startOrAdd="create" kind="applications" linkText={`Register ${singular.applications}`} qs={qs} />
  )
}

export default function NewApplicationCard(props: Props) {
  return (
    <NewCard
      title={`New ${singular.applications}`}
      description={`Register your source code as a named ${singular.applications}.`}
    >
      <LinkToNewApplication {...props} />
    </NewCard>
  )
}
