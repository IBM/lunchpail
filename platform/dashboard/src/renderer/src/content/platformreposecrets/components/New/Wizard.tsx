import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator"

import { type FormContextProps } from "@patternfly/react-core"

import type Props from "../Props"
import { Input } from "@jay/components/Forms"
import yaml, { type YamlProps } from "./yaml"
import NewResourceWizard, { password } from "@jay/components/NewResourceWizard"

import { singular } from "../../name"

export default function NewRepoSecretWizard() {
  const [searchParams] = useSearchParams()

  /** Initial value for form */
  const defaults = useCallback(
    (previousValues?: Record<string, string>) => {
      // are we editing an existing resource `rsrc`? if so, populate
      // the form defaults from its values
      const yaml = searchParams.get("yaml")
      const rsrc = yaml ? (JSON.parse(decodeURIComponent(yaml)) as Props) : undefined

      const repo = rsrc?.spec.repo ?? searchParams.get("repo") ?? ""

      return {
        name:
          rsrc?.metadata?.name ??
          (repo || "")
            .replace(/\./g, "-")
            .replace(/^http?s:\/\//, "")
            .replace(/$/, "-") +
            uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2, style: "lowerCase" }).replace(
              /[ _]/g,
              "-",
            ),
        namespace: rsrc?.metadata?.namespace ?? searchParams.get("namespace") ?? "default",
        repo,
        user: previousValues?.user ?? "",
        pat: previousValues?.pat ?? "",
      }
    },
    [searchParams],
  )

  /** GitHub repo */
  function repoInput(ctrl: FormContextProps) {
    return (
      <Input
        readOnlyVariant={searchParams.has("repo") ? "default" : undefined}
        fieldId="repo"
        label="GitHub provider"
        description="Base URI of your GitHub provider, e.g. https://github.mycompany.com"
        ctrl={ctrl}
      />
    )
  }

  /** GitHub user */
  function user(ctrl: FormContextProps) {
    return <Input fieldId="user" label="GitHub user" description="Your username in that GitHub provider" ctrl={ctrl} />
  }

  /** GitHub personal access token */
  const pat = password({
    fieldId: "pat",
    label: "GitHub personal access token",
    description: "Your username in that GitHub provider",
  })

  const step1 = {
    name: "Configure",
    isValid: (ctrl: FormContextProps) =>
      !!ctrl.values.name && !!ctrl.values.repo && !!ctrl.values.user && !!ctrl.values.pat,
    items: ["name" as const, repoInput, user, pat],
  }

  const getYaml = useCallback((values: Record<string, string>) => yaml(values as unknown as YamlProps), [])

  const title = "Create Repo Secret"
  const steps = [step1]
  return (
    <NewResourceWizard
      kind="workerpools"
      title={title}
      singular={singular}
      defaults={defaults}
      yaml={getYaml}
      steps={steps}
      returnToNewResource={false}
    >
      Configure a pattern matcher that provides access to source code in a given GitHub provider.
    </NewResourceWizard>
  )
}
