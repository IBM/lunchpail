import { useCallback } from "react"
import { uniqueNamesGenerator, colors } from "unique-names-generator"

import NewResourceWizard, { type DefaultValues } from "@jay/components/NewResourceWizard"

import yaml, { type YamlProps } from "./yaml"
import description from "../../description"
import { singular as computetarget } from "../../name"

type Values = DefaultValues<YamlProps>

export default function NewRepoSecretWizard() {
  /** Initial value for form */
  const defaults = useCallback((previousValues?: Values["values"]) => {
    return {
      name: previousValues?.name || uniqueNamesGenerator({ dictionaries: [colors], seed: 1696170097365 + Date.now() }),
      namespace: previousValues?.namespace || "default",
      type: previousValues?.type || "Kind",
    }
  }, [])

  const steps = []

  return (
    <NewResourceWizard<Values>
      kind="computetargets"
      title={`Create ${computetarget}`}
      singular={computetarget}
      defaults={defaults}
      yaml={yaml}
      steps={steps}
    >
      {description}
    </NewResourceWizard>
  )
}
