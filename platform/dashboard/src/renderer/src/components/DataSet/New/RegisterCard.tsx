import NewCard from "../../NewCard"
import { singular } from "../../../names"
import LinkToNewWizard from "../../../navigate/wizard"

type Props = {
  action: "create" | "register"
  namespace?: string
}

function LinkToNewDataSet(props: Props) {
  const qs: string[] = [`action=${props.action}`]
  if (props.namespace) {
    qs.push(`namespace=${props.namespace}`)
  }

  const name = singular.datasets
  const linkText = props.action === "register" ? `Register ${name}` : `Create ${name}`

  return <LinkToNewWizard startOrAdd="create" kind="datasets" linkText={linkText} qs={qs} />
}

export default function NewApplicationCard(props: Props) {
  const name = singular.datasets
  const { title, description } =
    props.action === "register"
      ? {
          title: `Existing ${name}`,
          description: `Register existing model data as a new ${singular.datasets} resource.`,
        }
      : {
          title: `New ${name}`,
          description: `Create a new ${singular.datasets} resource from provided data.`,
        }

  return (
    <NewCard title={title} description={description}>
      <LinkToNewDataSet {...props} />
    </NewCard>
  )
}
