import { useCallback, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator"

import { Button, type FormContextProps } from "@patternfly/react-core"

import { Input } from "../../Forms"
import NewResourceWizard, { type WizardProps as Props } from "../../NewResourceWizard"

import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon"
import EyeSlashIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon"

export default function NewRepoSecretWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Force the use of this repo */
  const repo = searchParams.get("repo")

  /** Namespace in which to create this resource */
  const namespace = searchParams.get("namespace") || "default"

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Record<string, string>) => ({
      name:
        (repo || "")
          .replace(/\./g, "-")
          .replace(/^http?s:\/\//, "")
          .replace(/$/, "-") +
        uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2, style: "lowerCase" }).replace(
          /[ _]/g,
          "-",
        ),
      count: String(1),
      size: "xs",
      repo: repo ?? "",
      user: previousValues?.user ?? "",
      pat: "",
    }),
    [searchParams],
  )

  function repoInput(ctrl: FormContextProps) {
    return (
      <Input
        readOnlyVariant={repo ? "default" : undefined}
        fieldId="repo"
        label="GitHub provider"
        description="Base URI of your GitHub provider, e.g. https://github.mycompany.com"
        ctrl={ctrl}
      />
    )
  }

  function user(ctrl: FormContextProps) {
    return <Input fieldId="user" label="GitHub user" description="Your username in that GitHub provider" ctrl={ctrl} />
  }

  /** Showing password in cleartext? */
  const [clearText, setClearText] = useState(false)
  const toggleClearText = useCallback(() => setClearText((curState) => !curState), [])
  function pat(ctrl: FormContextProps) {
    return (
      <Input
        type={!clearText ? "password" : undefined}
        fieldId="pat"
        label="GitHub personal access token"
        description="Your username in that GitHub provider"
        customIcon={
          <Button style={{ padding: 0 }} variant="plain" onClick={toggleClearText}>
            {!clearText ? <EyeSlashIcon /> : <EyeIcon />}
          </Button>
        }
        ctrl={ctrl}
      />
    )
  }

  const step1 = {
    name: "Configure",
    isValid: (ctrl: FormContextProps) =>
      !!ctrl.values.name && !!ctrl.values.repo && !!ctrl.values.user && !!ctrl.values.pat,
    items: ["name" as const, repoInput, user, pat],
  }

  function yaml(values: FormContextProps["values"]) {
    const apiVersion = "codeflare.dev/v1alpha1"
    const kind = "PlatformRepoSecret"

    return `
apiVersion: ${apiVersion}
kind: ${kind}
metadata:
  name: ${values.name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/managed-by: jay
spec:
  repo: ${values.repo}
  secret:
    name: ${values.name}
    namespace: ${namespace}
---
apiVersion: v1
kind: Secret
metadata:
  name: ${values.name}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/managed-by: jay
type: Opaque
data:
  user: ${btoa(values.user)}
  pat: ${btoa(values.pat)}
`.trim()
  }

  const title = "Create Repo Secret"
  const steps = [step1]
  return (
    <NewResourceWizard {...props} kind="workerpools" title={title} defaults={defaults} yaml={yaml} steps={steps}>
      Configure a pattern matcher that provides access to source code in a given GitHub provider.
    </NewResourceWizard>
  )
}
