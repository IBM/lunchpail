import DrawerContent from "../Drawer/Content"
import DeleteResourceButton from "../DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "../DescriptionGroup"

import { yamlFromSpec } from "./New/yaml"
import LinkToNewWizard from "../../navigate/wizard"

import type Props from "./Props"

/** The DescriptionList groups to show in this Detail view */
function detailGroups(props: Props) {
  return [descriptionGroup("Repo", props.spec.repo)]
}

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      kind="platformreposecrets.codeflare.dev"
      uiKind="platformreposecrets"
      yaml={yamlFromSpec(props)}
      name={props.metadata.name}
      namespace={props.metadata.namespace}
    />
  )
}

function Edit(props: Props) {
  const qs = [`yaml=${encodeURIComponent(JSON.stringify(props))}`]
  return <LinkToNewWizard startOrAdd="edit" kind="platformreposecrets" linkText="Edit" qs={qs} />
}

function PlatformRepoSecretDetail(props: Props) {
  return (
    <DrawerContent
      summary={props && <DescriptionList groups={detailGroups(props)} />}
      raw={props}
      actions={props && [<Edit {...props} />]}
      rightActions={props && [deleteAction(props)]}
    />
  )
}

export default function MaybePlatformRepoSecretDetail(props: Props | undefined) {
  return props && <PlatformRepoSecretDetail {...props} />
}
