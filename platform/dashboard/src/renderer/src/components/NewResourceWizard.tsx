import { type PropsWithChildren, type ReactNode, useCallback, useContext, useMemo, useState } from "react"

import {
  Alert,
  Button,
  type AlertProps,
  type AlertActionLinkProps,
  AlertActionLink,
  AlertActionCloseButton,
  Form,
  FormAlert,
  FormContextProvider,
  FormContextProps,
  FormSection,
  Grid,
  GridItem,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

import Yaml from "./Yaml"
import Settings from "../Settings"
import { singular } from "../names"
import { Input, TextArea, remember } from "./Forms"
import { returnHomeCallback, returnHomeCallbackWithEntity } from "../navigate/home"

import type { DetailableKind } from "../Kind"

import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon"
import EyeSlashIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon"

import "./Wizard.scss"

type KnownFormItem = "name" | "namespace" | "description"
type FormItem = KnownFormItem | ((ctrl: FormContextProps) => ReactNode)

type StepProps = {
  name: string
  items: FormItem[]
  isValid?: (ctrl: FormContextProps) => boolean
  alerts?: {
    title: string
    variant?: AlertProps["variant"]
    body: ReactNode
    actionLinks?: ((ctrl: FormContextProps) => AlertActionLinkProps & { linkText: string })[]
  }[]
}

type Props = PropsWithChildren<{
  kind: DetailableKind
  title: string
  isEdit?: boolean
  defaults: (previousValues: undefined | Record<string, string>) => Record<string, string>
  yaml: (values: FormContextProps["values"]) => string
  steps: StepProps[]
}>

const nextIsDisabled = { isNextDisabled: true }
const nextIsEnabled = { isNextDisabled: false }

export default function NewResourceWizard(props: Props) {
  /** Error in the request to create a pool? */
  const [errorInCreateRequest, setErrorInCreateRequest] = useState<null | unknown>(null)

  const clearError = useCallback(() => {
    setDryRunSuccess(null)
    setErrorInCreateRequest(null)
  }, [])

  const [dryRunSuccess, setDryRunSuccess] = useState<null | boolean>(null)

  const onCancel = returnHomeCallback()
  const onSuccess = returnHomeCallbackWithEntity()

  const doCreate = useCallback(async (values: FormContextProps["values"], dryRun = false) => {
    try {
      const response = await window.jay.create(values, props.yaml(values), dryRun)
      if (response !== true) {
        console.error(response)
        setDryRunSuccess(false)
        setErrorInCreateRequest(new Error(response.message))
      } else {
        setErrorInCreateRequest(null)
        if (dryRun) {
          setDryRunSuccess(true)
        } else {
          onSuccess({ kind: props.kind, id: values.name })
        }
      }
    } catch (errorInCreateRequest) {
      console.error(errorInCreateRequest)
      if (errorInCreateRequest) {
        setErrorInCreateRequest(errorInCreateRequest)
      }
    }
  }, [])

  const review = useCallback(
    (ctrl: FormContextProps) => {
      const doDryRun = () => doCreate(ctrl.values, true)

      return (
        <WizardStep
          key="wizard-step-review"
          id="wizard-step-review"
          name="Review"
          status={errorInCreateRequest ? "error" : "default"}
          footer={{
            nextButtonText: props.isEdit ? "Apply Changes" : `Create ${singular[props.kind]}`,
            onNext: () => doCreate(ctrl.values),
          }}
        >
          {errorInCreateRequest || dryRunSuccess !== null ? (
            <FormAlert>
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

          <FormAlert className="codeflare--step-header">
            <Alert
              variant="info"
              title="Review"
              isInline
              actionLinks={<AlertActionLink onClick={doDryRun}>Dry run</AlertActionLink>}
            >
              Confirm the settings for your new {singular[props.kind]}.
            </Alert>
          </FormAlert>

          <Yaml>{props.yaml(ctrl.values)}</Yaml>
        </WizardStep>
      )
    },
    [props.kind, clearError, doCreate, dryRunSuccess],
  )

  function name(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="name"
        label={`${singular[props.kind]} name`}
        description={`Choose a name for your ${singular[props.kind]}`}
        ctrl={ctrl}
      />
    )
  }

  function namespace(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="namespace"
        label="Namespace"
        description={`The namespace in which to register this ${singular[props.kind]}`}
        ctrl={ctrl}
      />
    )
  }

  function description(ctrl: FormContextProps) {
    return (
      <TextArea
        fieldId="description"
        label="Description"
        description={`Describe the details of your ${singular[props.kind]}`}
        ctrl={ctrl}
        rows={8}
      />
    )
  }

  const itemFor = useCallback((item: FormItem, ctrl: FormContextProps) => {
    if (item === "name") {
      return name(ctrl)
    } else if (item === "namespace") {
      return namespace(ctrl)
    } else if (item === "description") {
      return description(ctrl)
    } else {
      return item(ctrl)
    }
  }, [])

  const steps = useCallback(
    (ctrl: FormContextProps) => {
      return props.steps.map((step) => (
        <WizardStep
          key={step.name}
          id={`wizard-step-${step.name}`}
          name={step.name}
          footer={step.isValid && !step.isValid(ctrl) ? nextIsDisabled : nextIsEnabled}
        >
          {step.alerts?.map((alert, idx, A) => (
            <Alert
              key={alert.title}
              variant={alert.variant ?? "info"}
              className={idx < A.length - 1 ? "" : "codeflare--step-header"}
              actionLinks={alert.actionLinks
                ?.map((action) => action(ctrl))
                .map((action) => {
                  const linkProps: Record<string, unknown> = Object.assign({}, action, { linkText: null })
                  return (
                    <AlertActionLink key={action.linkText} {...linkProps}>
                      {action.linkText}
                    </AlertActionLink>
                  )
                })}
              isInline
              title={alert.title}
            >
              {alert.body}
            </Alert>
          ))}

          <Form>
            <FormSection>
              <Grid hasGutter md={6}>
                {step.items.map((item, idx) => (
                  <GridItem key={idx} span={12}>
                    {itemFor(item, ctrl)}
                  </GridItem>
                ))}
              </Grid>
            </FormSection>
          </Form>
        </WizardStep>
      ))
    },
    [props.steps],
  )

  const settings = useContext(Settings)
  const initialValues = useMemo(() => {
    const previousFormSerialized = settings?.form[0]
    const previousForm = previousFormSerialized ? JSON.parse(previousFormSerialized) : {}
    const previousValues = previousForm[props.kind]

    return props.defaults(previousValues)
  }, [props.kind, props.defaults, settings?.form[0]])

  const form = useCallback(
    (ctrlWithoutMemory: FormContextProps) => {
      const ctrl = remember(props.kind, ctrlWithoutMemory, settings?.form)

      const header = <WizardHeader title={props.title} description={props.children} onClose={onCancel} />
      return (
        <Wizard header={header} onClose={onCancel} onStepChange={clearError} className="codeflare--wizard">
          {steps(ctrl)}
          {review(ctrl)}
        </Wizard>
      )
    },
    [props.kind, onCancel, props.title, props.children, steps, review, clearError, settings?.form],
  )

  return <FormContextProvider initialValues={initialValues}>{form}</FormContextProvider>
}

function hasMessage(obj: unknown): obj is { message: string } {
  return typeof (obj as { message: string }).message === "string"
}

const noPadding = { padding: 0 }

/** @return an Input component that allows for toggling clear text mode */
export function password(props: { fieldId: string; label: string; description: string }) {
  /** Showing password in clear text? */
  const [clearText, setClearText] = useState(false)

  /** Toggle `clearText` state */
  const toggleClearText = useCallback(() => setClearText((curState) => !curState), [])

  return function pat(ctrl: FormContextProps) {
    return (
      <Input
        type={!clearText ? "password" : undefined}
        fieldId={props.fieldId}
        label={props.label}
        description={props.description}
        customIcon={
          <Button style={noPadding} variant="plain" onClick={toggleClearText}>
            {!clearText ? <EyeSlashIcon /> : <EyeIcon />}
          </Button>
        }
        ctrl={ctrl}
      />
    )
  }
}
