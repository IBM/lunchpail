import { Fragment, PureComponent, ReactNode } from "react"

import {
  Divider,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Page,
  PageSection,
  Switch,
  Toolbar,
  ToolbarGroup,
  ToolbarContent,
  ToolbarItem,
  TextContent,
  Text,
  MastheadToggle,
  PageToggleButton,
} from "@patternfly/react-core"

import navigateToHome from "../navigate/home"
import { navigateToWorkerPools } from "../navigate/home"

import type { LocationProps } from "../router/withLocation"

import { version } from "../../../../package.json"
import "@patternfly/react-core/dist/styles/base.css"
import SmallLabel from "../components/SmallLabel"
import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon"

export interface BaseState {
  /** UI in dark mode? */
  useDarkMode: boolean
}

export default abstract class Base<Props extends LocationProps, State extends BaseState> extends PureComponent<
  Props,
  State
> {
  private readonly toggleDarkMode = () =>
    this.setState((curState) => {
      const useDarkMode = !curState?.useDarkMode
      if (useDarkMode) document.querySelector("html")?.classList.add("pf-v5-theme-dark")
      else document.querySelector("html")?.classList.remove("pf-v5-theme-dark")

      return { useDarkMode }
    })

  protected headerToggle(): ReactNode {
    return (
      <MastheadToggle>
        <PageToggleButton variant="plain" aria-label="Global navigation" id="vertical-nav-toggle">
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
    )
  }

  /** Redirect back to the main page */
  protected readonly returnHome = () => navigateToHome(this.props)

  /** Redirect back to the WorkerPools section */
  protected readonly returnToWorkerPools = () => navigateToWorkerPools(this.props)

  protected pageTitle() {
    return "Jobs as a Service"
  }

  private header() {
    return (
      <Masthead display={this.inline}>
        {this.headerToggle()}
        <MastheadMain>
          <MastheadBrand>{this.pageTitle()}</MastheadBrand>
        </MastheadMain>
        <MastheadContent></MastheadContent>
      </Masthead>
    )
  }

  private get useDarkMode() {
    return this.state?.useDarkMode || false
  }

  protected sidebar(): ReactNode {
    return <Fragment />
  }

  /** The content of the page */
  protected abstract body(): ReactNode

  /** Content to be displayed in the left-hand part of the footer */
  protected footerLeft(): void | ReactNode {}

  /** Content to be displayed in the right-hand part of the footer */
  protected footerRight(): void | ReactNode {}

  private footer(): ReactNode {
    const left = this.footerLeft()
    const right = this.footerRight()
    return (
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup align={this.alignLeft}>
            <ToolbarItem>
              <SmallLabel>v{version}</SmallLabel>
            </ToolbarItem>
            {left || <Fragment />}
          </ToolbarGroup>

          <ToolbarGroup align={this.alignRight}>
            {right || <Fragment />}

            <ToolbarItem align={this.alignRight}>
              <Switch label="Dark Mode" isChecked={this.useDarkMode} onChange={this.toggleDarkMode} />
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
    )
  }

  /** Filter chips UI, will be displayed above the page body */
  protected chips(): void | ReactNode {}

  /** Modal overlay UI */
  protected modal(): ReactNode {
    return <Fragment />
  }

  protected readonly inline = { default: "inline" as const }
  protected readonly alignLeft = { default: "alignLeft" as const }
  protected readonly alignRight = { default: "alignRight" as const }
  protected readonly noPadding = { default: "noPadding" as const }
  protected readonly stickyTop = { default: "top" as const }
  protected readonly stickyBottom = { default: "bottom" as const }
  protected readonly transparent = { backgroundColor: "transparent" as const }

  /** Title content to place in the PageSection title stripe above the main body content */
  protected abstract title(): string

  /** Subtitle content to place in the PageSection title stripe above the main body content */
  protected abstract subtitle(): ReactNode

  public render() {
    const chips = this.chips()

    return (
      <Page
        header={this.header()}
        sidebar={this.sidebar()}
        isManagedSidebar
        defaultManagedSidebarIsOpen={true}
        className="codeflare--dashboard"
        data-is-dark-mode={this.useDarkMode}
      >
        {chips ? (
          <>
            <PageSection variant="light">{chips}</PageSection>
            <Divider />
          </>
        ) : (
          <></>
        )}
        <PageSection variant="light">
          <TextContent>
            <Text component="h1">{this.title()}</Text>
            <Text component="p">{this.subtitle()}</Text>
          </TextContent>
        </PageSection>

        <PageSection padding={this.noPadding} hasOverflowScroll isFilled aria-label="codeflare-dashboard-body">
          <Divider />
          {this.body()}
        </PageSection>
        <PageSection isFilled={false} stickyOnBreakpoint={this.stickyBottom} padding={this.noPadding}>
          {this.footer()}
        </PageSection>

        {this.modal()}
      </Page>
    )
  }
}
