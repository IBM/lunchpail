import NewCard from "../../NewCard"
import LinkToNewWizard from "../../../navigate/wizard"

type Props = {
  namespace?: string
}

export function LinkToNewApplication(props: Props) {
  const qs: string[] = []
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }
  return <LinkToNewWizard startOrAdd="create" kind="applications" linkText="Register Application" qs={qs} />
}

export default function NewApplicationCard(props: Props) {
  return (
    <NewCard title="New Application" description="Register your source code as a named Application.">
      <LinkToNewApplication {...props} />
    </NewCard>
  )
}
