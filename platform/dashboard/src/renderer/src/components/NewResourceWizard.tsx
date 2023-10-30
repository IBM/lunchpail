import { type PropsWithChildren, type ReactNode, useCallback, useContext, useMemo, useState } from "react"

import {
  Alert,
  type AlertProps,
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

import type Kind from "../Kind"
import type { WizardProps } from "../pages/DashboardModal"

import "./Wizard.scss"

export type { WizardProps }

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
    actionLinks?: { onClick: () => void; linkText: string }[]
  }[]
}

type Props = PropsWithChildren<
  WizardProps & {
    kind: Kind
    title: string
    defaults: (previousValues: undefined | Record<string, string>) => Record<string, string>
    yaml: (values: FormContextProps["values"]) => string
    steps: StepProps[]
  }
>

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

  const review = useCallback(
    (ctrl: FormContextProps) => {
      const doDryRun = () => doCreate(ctrl.values, true)

      return (
        <WizardStep
          id="wizard-step-review"
          name="Review"
          status={errorInCreateRequest ? "error" : "default"}
          footer={{ nextButtonText: `Create ${singular[props.kind]}`, onNext: () => doCreate(ctrl.values) }}
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

          <Yaml content={props.yaml(ctrl.values)} />
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
              actionLinks={alert.actionLinks?.map((action) => (
                <AlertActionLink key={action.linkText} onClick={action.onClick}>
                  {action.linkText}
                </AlertActionLink>
              ))}
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

      const header = <WizardHeader title={props.title} description={props.children} onClose={props.onCancel} />
      return (
        <Wizard header={header} onClose={props.onCancel} onStepChange={clearError}>
          {steps(ctrl)}
          {review(ctrl)}
        </Wizard>
      )
    },
    [props.kind, props.onCancel, props.title, props.children, steps, review, clearError, settings?.form],
  )

  return <FormContextProvider initialValues={initialValues}>{form}</FormContextProvider>
}

function hasMessage(obj: unknown): obj is { message: string } {
  return typeof (obj as { message: string }).message === "string"
}
