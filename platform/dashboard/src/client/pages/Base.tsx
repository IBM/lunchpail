import { Fragment, PureComponent, ReactNode } from "react"

import {
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
  MastheadToggle,
  PageToggleButton,
} from "@patternfly/react-core"

import { version } from "../../../package.json"
import "@patternfly/react-core/dist/styles/base.css"
import SmallLabel from "../components/SmallLabel"
import BarsIcon from "@patternfly/react-icons/dist/esm/icons/bars-icon"

export interface BaseState {
  /** UI in dark mode? */
  useDarkMode: boolean
}

export default class Base<Props = unknown, State extends BaseState = BaseState> extends PureComponent<Props, State> {
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

  protected pageTitle() {
    return "Jobs World Service"
  }

  private header() {
    return (
      <Masthead display={{ default: "inline" }}>
        {this.headerToggle()}
        <MastheadMain>
          <MastheadBrand>{this.pageTitle()}</MastheadBrand>
        </MastheadMain>
        <MastheadContent>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem align={{ default: "alignRight" }}>
                <Switch label="Dark Mode" isChecked={this.useDarkMode} onChange={this.toggleDarkMode} />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
    )
  }

  private get useDarkMode() {
    return this.state?.useDarkMode || false
  }

  protected sidebar(): ReactNode {
    return <Fragment />
  }

  protected body(): ReactNode {
    return <Fragment />
  }

  protected footerLeft(): ReactNode {
    return <Fragment />
  }

  protected footerRight(): ReactNode {
    return <Fragment />
  }

  private footer(): ReactNode {
    return (
      <Toolbar>
        <ToolbarContent>
          <ToolbarGroup align={{ default: "alignLeft" }}>
            <ToolbarItem>
              <SmallLabel>v{version}</SmallLabel>
            </ToolbarItem>
            {this.footerLeft()}
          </ToolbarGroup>

          <ToolbarGroup align={{ default: "alignRight" }}>{this.footerRight()}</ToolbarGroup>
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

  protected readonly noPadding = { default: "noPadding" as const }
  protected readonly stickyTop = { default: "top" as const }

  public render() {
    const chips = this.chips()

    return (
      <Page
        header={this.header()}
        sidebar={this.sidebar()}
        isManagedSidebar
        className="codeflare--dashboard"
        data-is-dark-mode={this.useDarkMode}
      >
        {chips ? (
          <PageSection variant="dark" stickyOnBreakpoint={this.stickyTop}>
            {chips}
          </PageSection>
        ) : (
          <></>
        )}

        <PageSection hasOverflowScroll isFilled aria-label="codeflare-dashboard-body">
          {this.body()}
        </PageSection>
        <PageSection padding={{ default: "noPadding" }} isFilled={false}>
          {this.footer()}
        </PageSection>

        {this.modal()}
      </Page>
    )
  }
}
