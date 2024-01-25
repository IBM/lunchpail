import DrawerContent from "@jaas/components/Drawer/Content"
import DeleteResourceButton from "@jaas/components/DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "@jaas/components/DescriptionGroup"

import { singular } from "../name"
import { yamlFromSpec } from "./New/yaml"
import LinkToNewWizard from "@jaas/renderer/navigate/wizard"

import type Props from "./Props"

/** The DescriptionList groups to show in this Detail view */
function detailGroups(props: Props) {
  return [descriptionGroup("Repo", props.spec.repo)]
}

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      singular={singular}
      kind="platformreposecrets.codeflare.dev"
      yaml={yamlFromSpec(props)}
      name={props.metadata.name}
      namespace={props.metadata.namespace}
      context={props.metadata.context}
    />
  )
}

function Edit(props: Props) {
  const qs = [`yaml=${encodeURIComponent(JSON.stringify(props))}`]
  return <LinkToNewWizard startOrAdd="edit" kind="platformreposecrets" linkText="Edit" qs={qs} />
}

export default function PlatformRepoSecretDetail(props: Props) {
  return (
    <DrawerContent
      summary={<DescriptionList groups={detailGroups(props)} />}
      raw={props}
      actions={[<Edit {...props} />]}
      rightActions={[deleteAction(props)]}
    />
  )
}
