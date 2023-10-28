import wordWrap from "word-wrap"
import { useSearchParams } from "react-router-dom"
import { useCallback, useContext, useState } from "react"
import { uniqueNamesGenerator, animals } from "unique-names-generator"

import {
  Alert,
  AlertActionCloseButton,
  Button,
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

import LightbulbIcon from "@patternfly/react-icons/dist/esm/icons/lightbulb-icon"
import DoubleCheckIcon from "@patternfly/react-icons/dist/esm/icons/check-double-icon"

import "../../Wizard.scss"

type Props = {
  /** Handler to call when this dialog closes */
  onSuccess(): void

  /** Handler to call when this dialog closes */
  onCancel(): void
}

const nextIsDisabled = { isNextDisabled: true }
const nextIsEnabled = { isNextDisabled: false }

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
      useTestQueue: previousValues?.useTestQueue ?? "true",
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
        labelInfo="e.g. https://github.com/myorg/myproject/tree/main/myappsource"
        description="URI to your GitHub repo, which can include the full path to a subdirectory"
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
        rows={8}
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
        isRequired={false}
      />
    )
  }

  const clearError = useCallback(() => {
    setDryRunSuccess(null)
    setErrorInCreateRequest(null)
  }, [])

  const [dryRunSuccess, setDryRunSuccess] = useState<null | boolean>(null)

  const doCreate = useCallback(async (values: FormContextProps["values"], dryRun = false) => {
    try {
      const response = await window.jay.create(values, yaml(values), dryRun)
      if (response !== true) {
        console.error(response)
        setDryRunSuccess(false)
        setErrorInCreateRequest(new Error(response.message))
      } else {
        setErrorInCreateRequest(null)
        if (dryRun) {
          setDryRunSuccess(true)
        } else {
          props.onSuccess()
        }
      }
    } catch (errorInCreateRequest) {
      console.error(errorInCreateRequest)
      if (errorInCreateRequest) {
        setErrorInCreateRequest(errorInCreateRequest)
      }
    }
  }, [])

  function header() {
    return (
      <WizardHeader
        title={`Register ${singular.applications}`}
        description={`An ${singular.applications} is a consumer of tasks. Teach us how to process data by registering one here.`}
        onClose={props.onCancel}
      />
    )
  }

  function isStep1Valid(ctrl: FormContextProps) {
    return !!ctrl.values.name && !!ctrl.values.namespace
  }

  function isStep2Valid(ctrl: FormContextProps) {
    return !!ctrl.values.repo && !!ctrl.values.image && !!ctrl.values.command
  }

  function step1(ctrl: FormContextProps) {
    return (
      <WizardStep id="wizard-step-1" name="Name" footer={!isStep1Valid(ctrl) ? nextIsDisabled : nextIsEnabled}>
        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={12}>{name(ctrl)}</GridItem>
              <GridItem span={12}>{namespace(ctrl)}</GridItem>
              <GridItem span={12}>{description(ctrl)}</GridItem>
            </Grid>
          </FormSection>
        </Form>
      </WizardStep>
    )
  }

  function step2(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="wizard-step-2"
        name="Code and Dependencies"
        footer={!isStep2Valid(ctrl) ? nextIsDisabled : nextIsEnabled}
      >
        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={12}>{command(ctrl)}</GridItem>
              <GridItem span={12}>{repoInput(ctrl)}</GridItem>
              <GridItem span={12}>{image(ctrl)}</GridItem>
              <GridItem span={12}>{supportsGpu(ctrl)}</GridItem>
            </Grid>
          </FormSection>
        </Form>
      </WizardStep>
    )
  }

  function useTestQueueCheckbox(ctrl: FormContextProps) {
    return (
      <Checkbox
        fieldId="useTestQueue"
        label="Use Internal Test Task Queue?"
        description="This uses a task queue that requires less configuration, but is less scalable"
        isChecked={ctrl.values.useTestQueue === "true"}
        ctrl={ctrl}
        isDisabled
        isRequired={true}
      />
    )
  }
  function step3(ctrl: FormContextProps) {
    return (
      <WizardStep id="wizard-step-3" name="Associated Task Queue">
        <Hint actions={<LightbulbIcon />} className="codeflare--step-header">
          <span>
            Your {singular.applications} should register itself as a <strong>consumer</strong> of tasks from a{" "}
            <strong>{singular.datasets}</strong>.
          </span>
        </Hint>

        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={12}>{useTestQueueCheckbox(ctrl)}</GridItem>
            </Grid>
          </FormSection>
        </Form>
      </WizardStep>
    )
  }

  /*function step2(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-worker-pool-step-locate" name="Choose a Location">
        TODO
      </WizardStep>
    )
  } */

  function yaml(values: FormContextProps["values"]) {
    const apiVersion = "codeflare.dev/v1alpha1"
    const kind = singular.applications
    const datasetName = values.datasetName ?? values.name.replace(/-/g, "")

    return `
apiVersion: ${apiVersion}
kind: ${kind}
metadata:
  name: ${values.name}
  namespace: ${values.namespace}
  labels:
    codeflare.dev/created-by: user
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: ${values.name}
spec:
  api: workqueue
  repo: ${values.repo}
  image: ${values.image}
  command: /opt/codeflare/worker/bin/watcher.sh ${values.command}
  supportsGpu: ${values.supportsGpu}
  inputs:
    - useas: mount
      sizes:
        xs: ${datasetName}
    - useas: mount
      sizes:
        xs: hap-models
  description: >-
${wordWrap(values.description, { trim: true, indent: "    ", width: 60 })}
---
apiVersion: com.ie.ibm.hpsys/v1alpha1
kind: Dataset
metadata:
  name: ${datasetName}
  namespace: ${values.namespace}
  labels:
    codeflare.dev/created-by: user
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: ${values.name}
spec:
  local:
    type: "COS"
    bucket: ${values.datasetBucket ?? values.name}
    endpoint: ${values.datasetEndpoint ?? "http://codeflare-s3.codeflare-system.svc.cluster.local:9000"}
    secret-name: ${datasetName + "cfsecret"}
    secret-namespace: ${values.namespace}
    provision: "true"
---
apiVersion: v1
kind: Secret
metadata:
  name: ${datasetName + "-cfsecret"}
  namespace: ${values.namespace}
  labels:
    app.kubernetes.io/component: ${values.name}
    app.kubernetes.io/part-of: codeflare.dev
    app.kubernetes.io/component: ${values.name}
type: Opaque
data:
  accessKeyID: ${btoa(values.datasetAccessKeyId ?? "codeflarey")}
  secretAccessKey: ${btoa(values.datasetSecretAccessKey ?? "codeflarey")}
`.trim()
  }

  function review(ctrl: FormContextProps) {
    const doDryRun = () => doCreate(ctrl.values, true)

    return (
      <WizardStep
        id="wizard-step-review"
        name="Review"
        status={errorInCreateRequest ? "error" : "default"}
        footer={{ nextButtonText: `Create ${singular.applications}`, onNext: () => doCreate(ctrl.values) }}
      >
        {errorInCreateRequest || dryRunSuccess !== null ? (
          <FormAlert className="codeflare--step-header">
            <Alert
              isInline
              actionClose={<AlertActionCloseButton onClose={clearError} />}
              variant={!errorInCreateRequest && dryRunSuccess ? "success" : "danger"}
              title={
                !errorInCreateRequest && dryRunSuccess
                  ? "Dry run successful"
                  : hasMessage(errorInCreateRequest)
                  ? errorInCreateRequest.message
                  : "Internal error"
              }
            />
          </FormAlert>
        ) : (
          <></>
        )}

        <Hint actions={<DoubleCheckIcon />}>
          <HintTitle>Review</HintTitle>
          <HintBody>
            Confirm the settings for your new repo secret.{" "}
            <Button variant="link" isInline onClick={doDryRun}>
              Dry run
            </Button>
          </HintBody>
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
            {step2(ctrl)}
            {step3(ctrl)}
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
