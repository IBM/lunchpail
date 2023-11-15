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
  type GridItemProps,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

import Yaml from "./Yaml"
import Settings from "../Settings"
import { Input, TextArea, remember } from "./Forms"
import { returnHomeCallback, returnHomeCallbackWithEntity } from "../navigate/home"

import type { DetailableKind } from "../content"

import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon"
import EyeSlashIcon from "@patternfly/react-icons/dist/esm/icons/eye-slash-icon"

import "./Wizard.scss"

type KnownFormItem = "name" | "namespace" | "description"
type FormItem = KnownFormItem | ((ctrl: FormContextProps) => ReactNode)

type StepProps = {
  /** This will be displayed as the step's name in the left-hand "guide" part of the Wizard UI */
  name: string

  /** Form choices to be displayed in this step */
  items: FormItem[]

  /**
   * Optionally, you may specify a parallel array to `items` that
   * indicates the Grid span for each item. If a number, it will be
   * used for all `items`.
   */
  gridSpans?: GridItemProps["span"] | GridItemProps["span"][]

  /** Validator for this step, if valid the user will be allowed to proceed to the Next step */
  isValid?: (ctrl: FormContextProps) => boolean

  /** Any Alerts to be rendered at the top of the step */
  alerts?: (Pick<AlertProps, "variant" | "isExpandable"> & {
    title: string
    variant?: AlertProps["variant"]
    body: AlertProps["children"]
    actionLinks?: ((ctrl: FormContextProps) => AlertActionLinkProps & { linkText: string })[]
  })[]
}

type Props = PropsWithChildren<{
  kind: DetailableKind
  title: string
  singular: string
  action?: "edit" | "clone" | "register" | null
  defaults: (previousValues: undefined | Record<string, string>) => Record<string, string>
  yaml: (values: FormContextProps["values"]) => string
  steps: StepProps[]

  /** On successful resource creation, return to show that new resource in the Details drawer? [default=true] */
  returnToNewResource?: boolean

  /** Callback when a form value changes */
  onChange?(fieldId: string, value: string, values: FormContextProps["values"]): void
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
  const onSuccess = props.returnToNewResource === false ? onCancel : returnHomeCallbackWithEntity()

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
            nextButtonText:
              props.action === "edit"
                ? "Apply Changes"
                : props.action === "clone"
                ? `Clone ${props.singular}`
                : props.action === "register"
                ? `Register ${props.singular}`
                : `Create ${props.singular}`,
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
              Confirm the settings for your new {props.singular}.
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
        label={`${props.singular} name`}
        description={`Choose a name for your ${props.singular}`}
        ctrl={ctrl}
      />
    )
  }

  function namespace(ctrl: FormContextProps) {
    return (
      <Input
        fieldId="namespace"
        label="Namespace"
        description={`The namespace in which to register this ${props.singular}`}
        ctrl={ctrl}
      />
    )
  }

  function description(ctrl: FormContextProps) {
    return (
      <TextArea
        fieldId="description"
        label="Description"
        description={`Describe the details of your ${props.singular}`}
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
              isInline
              key={alert.title}
              title={alert.title}
              variant={alert.variant ?? "info"}
              isExpandable={alert.isExpandable}
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
            >
              {alert.body}
            </Alert>
          ))}

          <Form>
            <FormSection>
              <Grid hasGutter md={6}>
                {step.items.map((item, idx) => {
                  const span =
                    typeof step.gridSpans === "number"
                      ? step.gridSpans
                      : (Array.isArray(step.gridSpans) ? step.gridSpans[idx] : undefined) ?? 12
                  return (
                    <GridItem key={idx} span={span}>
                      {itemFor(item, ctrl)}
                    </GridItem>
                  )
                })}
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

    const values = props.defaults(previousValues)
    const { onChange } = props
    if (onChange) {
      setTimeout(() => Object.entries(values).forEach(([fieldId, value]) => onChange(fieldId, value, values)))
    }
    return values
  }, [props.kind, props.defaults, settings?.form[0]])

  const form = useCallback(
    (ctrlWithoutMemory: FormContextProps) => {
      const ctrl = remember(props.kind, ctrlWithoutMemory, settings?.form, props.onChange)

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
