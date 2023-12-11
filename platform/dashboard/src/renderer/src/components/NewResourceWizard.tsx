import {
  type PropsWithChildren,
  type ReactNode,
  type ReactElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import {
  Alert,
  AlertGroup,
  type AlertProps,
  type AlertActionLinkProps,
  AlertActionLink,
  AlertActionCloseButton,
  Form,
  FormAlert,
  FormContextProvider,
  type FormContextProps,
  FormSection,
  Grid,
  GridItem,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core"

import Yaml from "./Yaml"
import Settings from "../Settings"
import { returnHomeCallback, returnHomeCallbackWithEntity } from "../navigate/home"

import Input from "./Forms/Input"
import TextArea from "./Forms/TextArea"
import remember from "./Forms/remember"

import type { DetailableKind } from "../content"

import "./Wizard.scss"

/**
 * This is a generic version of FormContextProps that allows the
 * concrete impls to have type safety over their form values.
 */
export type DefaultValues<Values extends FormContextProps["values"] = FormContextProps["values"]> = {
  setValue: FormContextProps["setValue"]
  values: Values
}

/** We have some built-in support for these common Form elements ("FormItem") */
type KnownFormItem = "name" | "namespace" | "description"

/** An element of a Form, e.g. an Input or TextArea, etc. */
type FormItem<Values extends DefaultValues> = KnownFormItem | ((ctrl: Values) => ReactNode)

/** An alert to be displayed at the top of a Wizard Step */
export type StepAlertProps<Values extends DefaultValues> = Pick<AlertProps, "variant" | "isExpandable"> & {
  title: string
  body: AlertProps["children"]
  actionLinks?: readonly ((ctrl: Values) => AlertActionLinkProps & { linkText: string })[]
}

/** One step in the Wizard */
type StepProps<Values extends DefaultValues> = {
  /** This will be displayed as the step's name in the left-hand "guide" part of the Wizard UI */
  name: string

  /**
   * Form choices to be displayed in this step. Either an array of
   * `FormItem` or a function that returns this array.
   */
  items: readonly FormItem<Values>[] | ((values: Values["values"]) => readonly FormItem<Values>[])

  /**
   * Optionally, you may specify a parallel array to `items` that
   * indicates the Grid span for each item. If a number, it will be
   * used for all `items`.
   */
  gridSpans?: number | readonly number[] | ((values: Values["values"]) => number | readonly number[])

  /** Validator for this step, if valid the user will be allowed to proceed to the Next step */
  isValid?: (ctrl: Values) => boolean

  /** Any Alerts to be rendered at the top of the step */
  alerts?: readonly StepAlertProps<Values>[] | ((values: Values["values"]) => readonly StepAlertProps<Values>[])
}

type Props<Values extends DefaultValues> = PropsWithChildren<{
  kind: DetailableKind
  title: string
  singular: string
  action?: "edit" | "clone" | "register" | null
  defaults: (previousValues: undefined | Values["values"]) => Values["values"]
  yaml: (values: Values["values"]) => string
  steps: readonly StepProps<Values>[]

  /** On successful resource creation, return to show that new resource in the Details drawer? [default=true] */
  returnToNewResource?: boolean

  /** Callback when a form value changes */
  onChange?(fieldId: string, value: string, values: Values["values"], setValue: Values["setValue"] | undefined): void
}>

const nextIsEnabled = { isNextDisabled: false }
const nextIsDisabled = { isNextDisabled: true }

function stepAlerts<Values extends DefaultValues>({ alerts }: StepProps<Values>, ctrl: Values) {
  if (alerts) {
    const alertProps = typeof alerts === "function" ? alerts(ctrl.values) : alerts
    return (
      <AlertGroup>
        {alertProps.map((alert, idx, A) => (
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
      </AlertGroup>
    )
  } else {
    return undefined
  }
}

export default function NewResourceWizard<Values extends DefaultValues = DefaultValues>(props: Props<Values>) {
  /** Error in the request to create a pool? */
  const [errorInCreateRequest, setErrorInCreateRequest] = useState<null | unknown>(null)

  const clearError = useCallback(() => {
    setDryRunSuccess(null)
    setErrorInCreateRequest(null)
  }, [])

  const [dryRunSuccess, setDryRunSuccess] = useState<null | boolean>(null)

  const onCancel = returnHomeCallback()
  const onSuccess = props.returnToNewResource === false ? onCancel : returnHomeCallbackWithEntity()

  const doCreate = useCallback(async (values: Values["values"], dryRun = false) => {
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
    (ctrl: Values) => {
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

  function name(ctrl: Values) {
    return (
      <Input
        fieldId="name"
        label={`${props.singular} name`}
        description={`Choose a name for your ${props.singular}`}
        ctrl={ctrl}
      />
    )
  }

  function namespace(ctrl: Values) {
    return (
      <Input
        fieldId="namespace"
        label="Namespace"
        description={`The namespace in which to register this ${props.singular}`}
        ctrl={ctrl}
      />
    )
  }

  function description(ctrl: Values) {
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

  const itemFor = useCallback((item: FormItem<Values>, ctrl: Values) => {
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
    (ctrl: Values) => {
      return props.steps.map((step) => (
        <WizardStep
          key={step.name}
          id={`wizard-step-${step.name}`}
          name={step.name}
          footer={step.isValid && !step.isValid(ctrl) ? nextIsDisabled : nextIsEnabled}
        >
          {stepAlerts(step, ctrl)}
          <Form>
            <FormSection>
              <Grid hasGutter md={6}>
                {(typeof step.items !== "function" ? step.items : step.items(ctrl.values)).map((item, idx) => {
                  const spanA = typeof step.gridSpans === "function" ? step.gridSpans(ctrl.values) : step.gridSpans
                  const span = typeof spanA === "number" ? spanA : (Array.isArray(spanA) ? spanA[idx] : undefined) ?? 12
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
      setTimeout(() =>
        Object.entries(values).forEach(([fieldId, value]) => onChange(fieldId, value, values, undefined)),
      )
    }
    return values
  }, [props.kind, props.defaults, settings?.form[0]])

  const form = useCallback(
    (ctrlWithoutMemory: Values) => {
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

  // re: typecast, FormContextProvider is not generic over values
  return (
    <FormContextProvider initialValues={initialValues}>
      {form as unknown as (ctrl: FormContextProps) => ReactElement}
    </FormContextProvider>
  )
}

function hasMessage(obj: unknown): obj is { message: string } {
  return typeof (obj as { message: string }).message === "string"
}
