import wordWrap from "word-wrap"
import { useSearchParams } from "react-router-dom"
import { useCallback, useContext, useState } from "react"
import { uniqueNamesGenerator, animals } from "unique-names-generator"

import {
  Alert,
  Form,
  FormAlert,
  FormContextProvider,
  FormContextProps,
  FormSection,
  Grid,
  GridItem,
  Hint,
  HintTitle,
  HintBody,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

import Yaml from "../../Yaml"
import Settings from "../../../Settings"
import { singular } from "../../../names"
import { Checkbox, Input, TextArea, remember } from "../../Forms"

import DoubleCheckIcon from "@patternfly/react-icons/dist/esm/icons/check-double-icon"

import "../../Wizard.scss"

type Props = {
  /** Handler to call when this dialog closes */
  onSuccess(): void

  /** Handler to call when this dialog closes */
  onCancel(): void
}

export default function NewApplicationWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Error in the request to create a pool? */
  const [errorInCreateRequest, setErrorInCreateRequest] = useState<null | unknown>(null)

  /** Initial value for form */
  function defaults(previousFormSerialized?: string) {
    const previousForm = previousFormSerialized ? JSON.parse(previousFormSerialized) : {}
    const previousValues = previousForm?.applications

    return {
      name: previousValues?.name ?? uniqueNamesGenerator({ dictionaries: [animals], seed: 1696170097365 + Date.now() }),
      namespace: searchParams.get("namespace") ?? previousValues?.namespace ?? "default",
      repo: previousValues?.repo ?? "",
      image: previousValues?.image ?? "ghcr.io/project-codeflare/codeflare-workerpool-worker-alpine-component:dev",
      command: previousValues?.command ?? "",
      description: previousValues?.description ?? "",
      supportsGpu: previousValues?.supportsGpu ?? "false",
    }
  }

  function name(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="name"
        label="Application name"
        description={`Choose a name for your ${singular.applications}`}
        ctrl={ctrl}
      />
    )
  }

  function namespace(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="namespace"
        label="Namespace"
        description={`The namespace in which to register this ${singular.applications}`}
        ctrl={ctrl}
      />
    )
  }

  function repoInput(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="repo"
        label="Source code"
        description="URI to your GitHub repo, which can include the full path to a subdirectory, as you browse"
        ctrl={ctrl}
      />
    )
  }

  function image(ctrl: FormContextProps) {
    return <Input fieldId="image" label="Image" description="The base image to run your code on" ctrl={ctrl} />
  }

  function command(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="command"
        label="Command line"
        description={`The command line used to launch your ${singular.applications}`}
        ctrl={ctrl}
      />
    )
  }

  function description(ctrl: FormContextProps) {
    return (
      <TextArea
        fieldId="description"
        label="Description"
        description={`Describe the details of your ${singular.applications}`}
        ctrl={ctrl}
        rows={4}
      />
    )
  }

  function supportsGpu(ctrl: FormContextProps) {
    return (
      <Checkbox
        fieldId="supportsGpu"
        label="Supports GPU?"
        description={`Does your ${singular.applications} support execution on GPUs?`}
        ctrl={ctrl}
      />
    )
  }

  const clearError = useCallback(() => setErrorInCreateRequest(null), [])

  const doCreate = useCallback(async (values: FormContextProps["values"]) => {
    try {
      const response = await window.jay.create(values, yaml(values))
      if (response !== true) {
        console.error(response)
        setErrorInCreateRequest(new Error(response.message))
      } else {
        setErrorInCreateRequest(null)
        props.onSuccess()
      }
    } catch (errorInCreateRequest) {
      console.error(errorInCreateRequest)
      if (errorInCreateRequest) {
        setErrorInCreateRequest(errorInCreateRequest)
        // TODO visualize this!!
      }
    }
  }, [])

  function header() {
    return (
      <WizardHeader
        title={`Register ${singular.applications}`}
        description={`Teach us how to process data by registering an ${singular.applications}`}
        onClose={props.onCancel}
      />
    )
  }

  function isStep1Valid(ctrl: FormContextProps) {
    return ctrl.values.name && ctrl.values.repo && ctrl.values.image && ctrl.values.command
  }

  function step1(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-repo-secret-step-configure" name="Configure" footer={{ isNextDisabled: !isStep1Valid(ctrl) }}>
        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={6}>{name(ctrl)}</GridItem>
              <GridItem span={6}>{namespace(ctrl)}</GridItem>
              <GridItem span={12}>{repoInput(ctrl)}</GridItem>
              <GridItem span={6}>{image(ctrl)}</GridItem>
              <GridItem span={6}>{command(ctrl)}</GridItem>
              <GridItem span={6}>{supportsGpu(ctrl)}</GridItem>
              <GridItem span={6}>{description(ctrl)}</GridItem>
            </Grid>
          </FormSection>
        </Form>
      </WizardStep>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  /*function step2(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-worker-pool-step-locate" name="Choose a Location">
        TODO
      </WizardStep>
    )
  }*/

  function yaml(values: FormContextProps["values"]) {
    const apiVersion = "codeflare.dev/v1alpha1"
    const kind = singular.applications

    return `
apiVersion: ${apiVersion}
kind: ${kind}
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
  labels:
    app.kubernetes.io/managed-by: jay
spec:
  api: workqueue
  repo: ${values.repo}
  image: ${values.image}
  command: /opt/codeflare/worker/bin/watcher.sh ${values.command}
  supportsGpu: ${values.supportsGpu}
  description: >-
${wordWrap(values.description, { trim: true, indent: "    ", width: 60 })}
`.trim()
  }

  function review(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="step-review"
        name="Review"
        status={errorInCreateRequest ? "error" : "default"}
        footer={{ nextButtonText: `Create ${singular.applications}`, onNext: () => doCreate(ctrl.values) }}
      >
        {errorInCreateRequest ? (
          <FormAlert className="codeflare--form-alert">
            <Alert
              isInline
              variant="danger"
              title={hasMessage(errorInCreateRequest) ? errorInCreateRequest.message : "Internal error"}
            />
          </FormAlert>
        ) : (
          <></>
        )}

        <Hint actions={<DoubleCheckIcon />}>
          <HintTitle>Review</HintTitle>
          <HintBody>Confirm the settings for your new repo secret.</HintBody>
        </Hint>

        <Yaml content={yaml(ctrl.values)} />
      </WizardStep>
    )
  }

  const settings = useContext(Settings)

  return (
    <FormContextProvider initialValues={defaults(settings?.form[0])}>
      {(ctrlWithoutMemory) => {
        const ctrl = remember("applications", ctrlWithoutMemory, settings?.form)

        return (
          <Wizard header={header()} onClose={props.onCancel} onStepChange={clearError}>
            {step1(ctrl)}
            {review(ctrl)}
          </Wizard>
        )
      }}
    </FormContextProvider>
  )
}

function hasMessage(obj: unknown): obj is { message: string } {
  return typeof (obj as { message: string }).message === "string"
}
