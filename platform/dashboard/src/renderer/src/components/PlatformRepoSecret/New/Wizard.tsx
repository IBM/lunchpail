import { useSearchParams } from "react-router-dom"
import { useCallback, useContext, useState } from "react"
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator"

import {
  Alert,
  AlertGroup,
  Button,
  Form,
  FormContextProvider,
  FormContextProps,
  FormSection,
  Grid,
  GridItem,
  TextContent,
  Text,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

import Yaml from "../../Yaml"
import { Input, remember } from "../../Forms"
import { singular as names } from "../../../names"

import type { WizardProps as Props } from "../../../pages/DashboardModal"

import Settings from "../../../Settings"

import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon"
import EyeSlashIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon"

export default function NewRepoSecretWizard(props: Props) {
  const [searchParams] = useSearchParams()

  /** Error in the request to create a pool? */
  const [errorInCreateRequest, setErrorInCreateRequest] = useState<null | unknown>(null)

  /** Force the use of this repo */
  const repo = searchParams.get("repo")

  /** Namespace in which to create this resource */
  const namespace = searchParams.get("namespace") || "default"

  /** Initial value for form */
  function defaults(previousFormSerialized?: string) {
    const previousValues = previousFormSerialized ? JSON.parse(previousFormSerialized) : {}

    return {
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
      repo: repo || "",
      user: previousValues?.platformreposecrets?.user,
      pat: "",
    }
  }

  function name(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="name"
        label="Repo Secret name"
        description={`Choose a name for your ${names.platformreposecrets}`}
        ctrl={ctrl}
      />
    )
  }

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
      if (errorInCreateRequest) {
        setErrorInCreateRequest(errorInCreateRequest)
        // TODO visualize this!!
      }
    }
  }, [])

  function header() {
    return (
      <WizardHeader
        title="Create Repo Secret"
        description="Configure a pattern matcher that provides access to source code in a given GitHub provider."
        onClose={props.onCancel}
      />
    )
  }

  function isStep1Valid(ctrl: FormContextProps) {
    return ctrl.values.name && ctrl.values.repo && ctrl.values.user && ctrl.values.pat
  }

  function step1(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-repo-secret-step-configure" name="Configure" footer={{ isNextDisabled: !isStep1Valid(ctrl) }}>
        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={12}>{name(ctrl)}</GridItem>
              <GridItem span={12}>{repoInput(ctrl)}</GridItem>
              <GridItem>{user(ctrl)}</GridItem>
              <GridItem>{pat(ctrl)}</GridItem>
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

  function review(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="step-review"
        name="Review"
        status={errorInCreateRequest ? "error" : "default"}
        footer={{ nextButtonText: "Create Repo Secret", onNext: () => doCreate(ctrl.values) }}
      >
        {errorInCreateRequest ? (
          <AlertGroup isToast>
            <Alert
              variant="danger"
              title={hasMessage(errorInCreateRequest) ? errorInCreateRequest.message : "Internal error"}
            />
          </AlertGroup>
        ) : (
          <></>
        )}

        <TextContent>
          <Text component="p">Confirm the settings for your new repo secret.</Text>
        </TextContent>

        <Yaml content={yaml(ctrl.values)} />
      </WizardStep>
    )
  }

  const settings = useContext(Settings)

  return (
    <FormContextProvider initialValues={defaults(settings?.form[0])}>
      {(ctrl) => (
        <Wizard header={header()} onClose={props.onCancel} onStepChange={clearError}>
          {step1(remember("platformreposecrets", ctrl, settings?.form))}
          {review(ctrl)}
        </Wizard>
      )}
    </FormContextProvider>
  )
}

function hasMessage(obj: unknown): obj is { message: string } {
  return typeof (obj as { message: string }).message === "string"
}
