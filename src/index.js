import React from 'react';
import ReactDOM from 'react-dom/client';
import PortfolioCalculator from '../orig-real-estate-calculator.tsx';

// Create root and render the component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PortfolioCalculator />
  </React.StrictMode>
);