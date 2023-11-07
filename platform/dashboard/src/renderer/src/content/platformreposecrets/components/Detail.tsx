import DrawerContent from "@jay/components/Drawer/Content"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

import { singular } from "../name"
import { yamlFromSpec } from "./New/yaml"
import LinkToNewWizard from "@jay/renderer/navigate/wizard"

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
