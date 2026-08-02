import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary] Component crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Silent fail — render nothing instead of crashing the entire page
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}
