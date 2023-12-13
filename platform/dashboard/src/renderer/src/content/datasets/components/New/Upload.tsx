import type { FormContextProps } from "@patternfly/react-core"

import Input from "@jay/components/Forms/Input"
import Tiles, { type TileOptions } from "@jay/components/Forms/Tiles"

import type LocationProps from "@jay/renderer/navigate/LocationProps"
import { buttonPropsForNewRepoSecret } from "@jay/renderer/navigate/newreposecret"

/** Options for the origin of uploaded data */
const options: TileOptions = [
  {
    title: "None",
    value: "none",
    description: "If you do not need to upload any data, select this option",
  },
  {
    title: "Git",
    value: "git",
    description: "Pull data from a given Git repository",
  },
  {
    title: "Local",
    value: "local",
    description: "Upload from a local directory",
    isDisabled: true,
  },
  {
    title: "S3",
    value: "s3",
    description: "Upload objects from an existing S3 bucket",
    isDisabled: true,
  },
]

/** Choose the origin of the data to be uploaded */
function origin(ctrl: FormContextProps) {
  return (
    <Tiles
      fieldId="uploadOrigin"
      label="Origin"
      labelInfo="Choose the origin of your data"
      ctrl={ctrl}
      options={options}
    />
  )
}

/** User has requested to upload data from git */
function repo(ctrl: FormContextProps) {
  return (
    <Input
      fieldId="uploadRepo"
      label="Repo"
      labelInfo="e.g. https://github.com/myorg/myproject/tree/main/mydata"
      description="URI to your GitHub repo, which can include the full path to a subdirectory"
      ctrl={ctrl}
    />
  )
}

/** The FormItems to present */
function items({ values }: FormContextProps) {
  return [origin, ...(values.uploadOrigin === "git" ? [repo] : [])]
}

/** Offer to upload data to the DataSet */
function stepUpload(missingPlatformRepoSecret: boolean, locationProps: Omit<LocationProps, "navigate">) {
  return {
    name: "Upload",
    items: items,
    alerts: (values: FormContextProps["values"]) =>
      values.uploadOrigin !== "git" || !missingPlatformRepoSecret
        ? []
        : [
            {
              title: "Missing Repo Secret",
              variant: "danger" as const,
              body: "To facilitate copying the specified initial data from git, you will need to provide a repo secret",
              actionLinks: [
                (ctrl: FormContextProps) =>
                  buttonPropsForNewRepoSecret(locationProps, {
                    repo: ctrl.values.uploadRepo,
                    namespace: ctrl.values.namespace,
                  }),
              ],
            },
          ],
  }
}

export default stepUpload
