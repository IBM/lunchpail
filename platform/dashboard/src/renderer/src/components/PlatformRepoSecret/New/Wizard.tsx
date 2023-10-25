import { useCallback, useEffect, useState } from "react"
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter"
import yamlLanguage from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import { nord as syntaxHighlightTheme } from "react-syntax-highlighter/dist/esm/styles/prism"

import {
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

import { Input } from "../../Forms"
import { singular as names } from "../../../names"

import Settings from "../../../Settings"

import type { Dispatch, SetStateAction } from "react"

import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon"
import EyeSlashIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon"

type Props = {
  /** Force the use of this repo */
  repo?: string | null

  /** Namespace in which to create this resource */
  namespace: string

  /** Handler to call when this dialog closes */
  onSuccess(): void

  /** Handler to call when this dialog closes */
  onCancel(): void
}

export default function NewRepoSecretWizard(props: Props) {
  /** Error in the request to create a pool? */
  const [, setErrorInCreateRequest] = useState<null | unknown>(null)

  /** Showing password in cleartext? */
  const [clearText, setClearText] = useState(false)

  /** Initial value for form */
  function defaults(user = "") {
    return {
      name:
        (props.repo || "")
          .replace(/\./g, "-")
          .replace(/^http?s:\/\//, "")
          .replace(/$/, "-") +
        uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2, style: "lowerCase" }).replace(
          /[ _]/g,
          "-",
        ),
      count: String(1),
      size: "xs",
      repo: props.repo || "",
      user,
      pat: "",
    }
  }

  useEffect(() => {
    SyntaxHighlighter.registerLanguage("yaml", yamlLanguage)
  }, [])

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

  function repo(ctrl: FormContextProps) {
    return (
      <Input
        readOnlyVariant={props.repo ? "default" : undefined}
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

  const doCreate = useCallback(async (values: FormContextProps["values"]) => {
    try {
      await window.jay.create(values, yaml(values))
    } catch (errorInCreateRequest) {
      if (errorInCreateRequest) {
        setErrorInCreateRequest(errorInCreateRequest)
        // TODO visualize this!!
      }
    }
    props.onSuccess()
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
              <GridItem span={12}>{repo(ctrl)}</GridItem>
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
  namespace: ${props.namespace}
  labels:
    app.kubernetes.io/managed-by: jay
spec:
  repo: ${values.repo}
  secret:
    name: ${values.name}
    namespace: ${props.namespace}
---
apiVersion: v1
kind: Secret
metadata:
  name: ${values.name}
  namespace: ${props.namespace}
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
        footer={{ nextButtonText: "Create Repo Secret", onNext: () => doCreate(ctrl.values) }}
      >
        <TextContent>
          <Text component="p">Confirm the settings for your new repo secret.</Text>
        </TextContent>

        <SyntaxHighlighter language="yaml" style={syntaxHighlightTheme} showLineNumbers>
          {yaml(ctrl.values)}
        </SyntaxHighlighter>
      </WizardStep>
    )
  }

  function wrapWithSettings(ctrl: FormContextProps, setUser: Dispatch<SetStateAction<string>> | undefined) {
    const { setValue: origSetValue } = ctrl
    return Object.assign({}, ctrl, {
      setValue(fieldId: string, value: string) {
        origSetValue(fieldId, value)
        if (fieldId === "user" && setUser) {
          // remember user setting
          setUser(value)
        }
      },
    })
  }

  return (
    <Settings.Consumer>
      {(settings) => (
        <FormContextProvider initialValues={defaults(settings?.prsUser[0])}>
          {(ctrl) => (
            <Wizard header={header()} onClose={props.onCancel}>
              {step1(wrapWithSettings(ctrl, settings?.prsUser[1]))}
              {review(ctrl)}
            </Wizard>
          )}
        </FormContextProvider>
      )}
    </Settings.Consumer>
  )
}
