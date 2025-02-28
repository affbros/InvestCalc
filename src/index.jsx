import React from 'react';
import ReactDOM from 'react-dom/client';
import PortfolioCalculator from './PortfolioCalculator';
import './styles.css';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid red',
          borderRadius: '5px',
          backgroundColor: '#fff8f8'
        }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Show error details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// Ensure the DOM is fully loaded
const renderApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("Root element not found!");
      return;
    }
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <PortfolioCalculator />
      </ErrorBoundary>
    );
    
    console.log("Application rendered successfully");
  } catch (error) {
    console.error("Error rendering application:", error);
    document.getElementById('root').innerHTML = `
      <div style="color: red; padding: 20px; border: 1px solid red;">
        <h2>Failed to load application</h2>
        <p>${error.message}</p>
      </div>
    `;
  }
};

// If the DOM is already loaded, render immediately, otherwise wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}