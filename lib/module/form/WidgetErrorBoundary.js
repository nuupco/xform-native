"use strict";

/**
 * WidgetErrorBoundary — catches render errors thrown by a widget subtree
 * (REQ: Widget Error Boundary).
 *
 * Only class components can implement getDerivedStateFromError, so this
 * must stay a class component. Placement (Form.tsx renderContent, question
 * case): wraps ONLY the <Widget> subtree, never the nav row, so Back/Next
 * remain usable even when a widget throws. Keyed by the same stable
 * per-instance key as the wrapped Widget (ev.index) so navigating to a
 * different question remounts a fresh boundary (hasError reset).
 */
import { Component } from 'react';
export class WidgetErrorBoundary extends Component {
  state = {
    hasError: false
  };
  static getDerivedStateFromError() {
    return {
      hasError: true
    };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
//# sourceMappingURL=WidgetErrorBoundary.js.map