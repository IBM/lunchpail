import { PureComponent } from "react"
import { uniqueNamesGenerator, adjectives, animals } from "unique-names-generator"
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
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
import type { LocationProps } from "../../../router/withLocation"
import type CreateResourceHandler from "@jay/common/events/NewPoolHandler"

import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon"
import EyeSlashIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon"

type Props = Pick<LocationProps, "searchParams"> & {
  /** Force the use of this repo */
  repo?: string | null

  /** Namespace in which to create this resource */
  namespace: string

  /** Handler to call when this dialog closes */
  onSuccess(): void

  /** Handler to call when this dialog closes */
  onCancel(): void

  /** Handler for Submit */
  createResource: CreateResourceHandler
}

type State = {
  /** Error in the request to create a pool? */
  errorInCreateRequest?: unknown

  /** Showing password in cleartext? */
  clearText?: boolean
}

export default class NewRepoSecretWizard extends PureComponent<Props, State> {
  /** Initial value for form */
  private defaults(user = "") {
    return {
      name:
        (this.props.repo || "")
          .replace(/\./g, "-")
          .replace(/^http?s:\/\//, "")
          .replace(/$/, "-") +
        uniqueNamesGenerator({ dictionaries: [adjectives, animals], length: 2, style: "lowerCase" }).replace(
          /[ _]/g,
          "-",
        ),
      count: String(1),
      size: "xs",
      repo: this.props.repo || "",
      user,
      pat: "",
    }
  }

  public componentDidMount() {
    SyntaxHighlighter.registerLanguage("yaml", yaml)
  }

  private name(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="name"
        label="Repo Secret name"
        description={`Choose a name for your ${names.platformreposecrets}`}
        ctrl={ctrl}
      />
    )
  }

  private repo(ctrl: FormContextProps) {
    return (
      <Input
        readOnlyVariant={this.props.repo ? "default" : undefined}
        fieldId="repo"
        label="GitHub provider"
        description="Base URI of your GitHub provider, e.g. https://github.mycompany.com"
        ctrl={ctrl}
      />
    )
  }

  private user(ctrl: FormContextProps) {
    return <Input fieldId="user" label="GitHub user" description="Your username in that GitHub provider" ctrl={ctrl} />
  }

  private readonly toggleClearText = () => this.setState((curState) => ({ clearText: !curState?.clearText }))

  private pat(ctrl: FormContextProps) {
    return (
      <Input
        type={!this.state?.clearText ? "password" : undefined}
        fieldId="pat"
        label="GitHub personal access token"
        description="Your username in that GitHub provider"
        customIcon={
          <Button style={{ padding: 0 }} variant="plain" onClick={this.toggleClearText}>
            {!this.state?.clearText ? <EyeSlashIcon /> : <EyeIcon />}
          </Button>
        }
        ctrl={ctrl}
      />
    )
  }

  private readonly doCreate = async (values: FormContextProps["values"]) => {
    try {
      await this.props.createResource(values, this.yaml(values))
    } catch (errorInCreateRequest) {
      if (errorInCreateRequest) {
        this.setState({ errorInCreateRequest })
        // TODO visualize this!!
      }
    }
    this.props.onSuccess()
  }

  private header() {
    return (
      <WizardHeader
        title="Create Repo Secret"
        description="Configure a pattern matcher that provides access to source code in a given GitHub provider."
        onClose={this.props.onCancel}
      />
    )
  }

  private isStep1Valid(ctrl: FormContextProps) {
    return ctrl.values.name && ctrl.values.repo && ctrl.values.user && ctrl.values.pat
  }

  private step1(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="new-repo-secret-step-configure"
        name="Configure"
        footer={{ isNextDisabled: !this.isStep1Valid(ctrl) }}
      >
        <Form>
          <FormSection>
            <Grid hasGutter md={6}>
              <GridItem span={12}>{this.name(ctrl)}</GridItem>
              <GridItem span={12}>{this.repo(ctrl)}</GridItem>
              <GridItem>{this.user(ctrl)}</GridItem>
              <GridItem>{this.pat(ctrl)}</GridItem>
            </Grid>
          </FormSection>
        </Form>
      </WizardStep>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  /*private step2(ctrl: FormContextProps) {
    return (
      <WizardStep id="new-worker-pool-step-locate" name="Choose a Location">
        TODO
      </WizardStep>
    )
  }*/

  private yaml(values: FormContextProps["values"]) {
    const apiVersion = "codeflare.dev/v1alpha1"
    const kind = "PlatformRepoSecret"

    return `
apiVersion: ${apiVersion}
kind: ${kind}
metadata:
  name: ${values.name}
  namespace: ${this.props.namespace}
  labels:
    app.kubernetes.io/managed-by: jay
spec:
  repo: ${values.repo}
  secret:
    name: ${values.name}
    namespace: ${this.props.namespace}
---
apiVersion: v1
kind: Secret
metadata:
  name: ${values.name}
  namespace: ${this.props.namespace}
  labels:
    app.kubernetes.io/managed-by: jay
type: Opaque
data:
  user: ${btoa(values.user)}
  pat: ${btoa(values.pat)}
`.trim()
  }

  private review(ctrl: FormContextProps) {
    return (
      <WizardStep
        id="step-review"
        name="Review"
        footer={{ nextButtonText: "Create Repo Secret", onNext: () => this.doCreate(ctrl.values) }}
      >
        <TextContent>
          <Text component="p">Confirm the settings for your new repo secret.</Text>
        </TextContent>

        <SyntaxHighlighter language="yaml" style={syntaxHighlightTheme} showLineNumbers>
          {this.yaml(ctrl.values)}
        </SyntaxHighlighter>
      </WizardStep>
    )
  }

  private wrapWithSettings(ctrl: FormContextProps, setUser: Dispatch<SetStateAction<string>> | undefined) {
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

  public render() {
    return (
      <Settings.Consumer>
        {(settings) => (
          <FormContextProvider initialValues={this.defaults(settings?.prsUser[0])}>
            {(ctrl) => (
              <Wizard header={this.header()} onClose={this.props.onCancel}>
                {this.step1(this.wrapWithSettings(ctrl, settings?.prsUser[1]))}
                {this.review(ctrl)}
              </Wizard>
            )}
          </FormContextProvider>
        )}
      </Settings.Consumer>
    )
  }
}
