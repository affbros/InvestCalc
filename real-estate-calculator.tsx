import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Default property values for a new house.
const defaultHouse = {
  id: Date.now(),
  propertyName: '',
  propertyValue: 600000,
  downPayment: 150000,
  annualAppreciation: 6,
  propertyTaxRate: 0.51,
  monthlyRent: 2500,
  rentalAppreciation: 5,
  interestRate: 4.5,
  loanTerm: 30,
  isEditing: true, // New houses start in editing mode.
};

// Simulation for a single property (30-year projection)
const simulateHouseProjection = (house) => {
  const {
    propertyValue,
    downPayment,
    annualAppreciation,
    propertyTaxRate,
    monthlyRent,
    rentalAppreciation,
    interestRate,
    loanTerm,
  } = house;
  const loanAmount = propertyValue - downPayment;
  const projectionData = [];

  // Year 0 snapshot.
  projectionData.push({
    year: 0,
    propertyValue,
    equity: downPayment,
    annualRentalIncome: monthlyRent * 12,
    propertyTax: propertyValue * (propertyTaxRate / 100),
    cashFlow: 0,
    mortgagePayment: 0,
    remainingLoanBalance: loanAmount,
    principalPaid: 0,
    interestPaid: 0,
    recaptureEstimate: 0,
    totalReturn: 0,
    roi: 0,
  });

  // Set initial variables.
  let cumulativeCashFlow = 0;
  let currentPropertyValue = propertyValue;
  let currentRent = monthlyRent;
  let remainingLoanBalance = loanAmount;
  const monthlyRate = interestRate / 100 / 12;
  const calculateMonthlyPayment = (principal, rate, years) => {
    const numPayments = years * 12;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  };
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

  // For depreciation recapture, assume 80% of the purchase price is depreciable over 27.5 years.
  const depreciableBasis = propertyValue * 0.8;
  const annualDepreciation = depreciableBasis / 27.5;

  // Simulate each year.
  for (let year = 1; year <= 30; year++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    let yearMortgagePayment = 0;

    // Simulate 12 months.
    for (let month = 0; month < 12; month++) {
      if (remainingLoanBalance > 0) {
        const interestForMonth = remainingLoanBalance * monthlyRate;
        let principalForMonth = monthlyPayment - interestForMonth;
        if (principalForMonth > remainingLoanBalance) {
          principalForMonth = remainingLoanBalance;
        }
        const payment = interestForMonth + principalForMonth;
        remainingLoanBalance -= principalForMonth;
        yearInterest += interestForMonth;
        yearPrincipal += principalForMonth;
        yearMortgagePayment += payment;
      }
    }

    const propertyTax = currentPropertyValue * (propertyTaxRate / 100);
    const annualRentalIncome = currentRent * 12;
    const cashFlow = annualRentalIncome - yearMortgagePayment - propertyTax;
    cumulativeCashFlow += cashFlow;

    // Equity: current property value minus remaining balance.
    const currentEquity = currentPropertyValue - remainingLoanBalance;
    const equityGrowth = currentEquity - downPayment;

    // Depreciation recapture.
    const cumulativeDepreciation = Math.min(annualDepreciation * year, depreciableBasis);
    const recaptureEstimate = cumulativeDepreciation * 0.25;

    const totalReturn = equityGrowth + cumulativeCashFlow - recaptureEstimate;
    const roi = (totalReturn / downPayment) * 100;

    projectionData.push({
      year,
      propertyValue: currentPropertyValue,
      equity: currentEquity,
      annualRentalIncome,
      propertyTax,
      cashFlow,
      mortgagePayment: yearMortgagePayment,
      remainingLoanBalance,
      principalPaid: yearPrincipal,
      interestPaid: yearInterest,
      recaptureEstimate,
      totalReturn,
      roi,
    });

    currentPropertyValue *= (1 + annualAppreciation / 100);
    currentRent *= (1 + rentalAppreciation / 100);
  }

  return projectionData;
};

// Aggregate projections for the entire portfolio.
const aggregateProjections = (portfolio) => {
  const aggregated = [];
  for (let year = 0; year <= 30; year++) {
    let agg = {
      year,
      propertyValue: 0,
      equity: 0,
      annualRentalIncome: 0,
      propertyTax: 0,
      cashFlow: 0,
      mortgagePayment: 0,
      remainingLoanBalance: 0,
      principalPaid: 0,
      interestPaid: 0,
      recaptureEstimate: 0,
      totalReturn: 0,
      roi: 0,
    };
    portfolio.forEach((house) => {
      const projections = simulateHouseProjection(house);
      const dataForYear = projections[year];
      agg.propertyValue += dataForYear.propertyValue;
      agg.equity += dataForYear.equity;
      agg.annualRentalIncome += dataForYear.annualRentalIncome;
      agg.propertyTax += dataForYear.propertyTax;
      agg.cashFlow += dataForYear.cashFlow;
      agg.mortgagePayment += dataForYear.mortgagePayment;
      agg.remainingLoanBalance += dataForYear.remainingLoanBalance;
      agg.principalPaid += dataForYear.principalPaid;
      agg.interestPaid += dataForYear.interestPaid;
      agg.recaptureEstimate += dataForYear.recaptureEstimate;
      agg.totalReturn += dataForYear.totalReturn;
    });
    const totalDownPayment = portfolio.reduce((sum, house) => sum + house.downPayment, 0);
    agg.roi = totalDownPayment > 0 ? (agg.totalReturn / totalDownPayment) * 100 : 0;
    aggregated.push(agg);
  }
  return aggregated;
};

const PortfolioCalculator = () => {
  const [portfolio, setPortfolio] = useState([defaultHouse]);
  const [portfolioProjections, setPortfolioProjections] = useState([]);
  const [activeTab, setActiveTab] = useState('graph');

  // Update aggregated projections when the portfolio changes.
  useEffect(() => {
    setPortfolioProjections(aggregateProjections(portfolio));
  }, [portfolio]);

  // Add a new house (which starts in editing mode).
  const addHouse = () => {
    const newHouse = { ...defaultHouse, id: Date.now(), isEditing: true, propertyName: '' };
    setPortfolio([...portfolio, newHouse]);
  };

  // Update a field for a specific house.
  const updateHouse = (id, field, value) => {
    setPortfolio(portfolio.map((house) => house.id === id ? { ...house, [field]: value } : house));
  };

  // When the user submits the house form, set its editing state to false.
  const submitHouse = (id) => {
    setPortfolio(portfolio.map((house) =>
      house.id === id ? { ...house, isEditing: false } : house
    ));
  };

  // When editing is triggered (from the sidebar), mark that house as editing.
  const editHouse = (id) => {
    setPortfolio(portfolio.map((house) =>
      house.id === id ? { ...house, isEditing: true } : house
    ));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="p-4 max-w-7xl mx-auto bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-center">Real Estate Portfolio Growth Calculator</h1>
      <div className="flex">
        {/* Left Sidebar: Submitted Houses */}
        <div className="w-1/4 pr-4 border-r">
          <h2 className="text-xl font-semibold mb-2">Properties</h2>
          {portfolio.filter((house) => !house.isEditing).map((house) => (
            <div key={house.id} className="bg-white p-2 mb-2 border rounded flex items-center justify-between">
              <span>{house.propertyName || 'Unnamed Property'}</span>
              <button
                className="text-blue-500 text-sm"
                onClick={() => editHouse(house.id)}
              >
                Edit
              </button>
            </div>
          ))}
          <button className="mt-4 p-2 bg-blue-500 text-white rounded w-full" onClick={addHouse}>
            Add House
          </button>
        </div>

        {/* Right Panel: House Forms (editing mode) */}
        <div className="w-3/4 pl-4">
          {portfolio.filter((house) => house.isEditing).map((house) => (
            <div key={house.id} className="bg-white p-4 mb-4 border rounded">
              <h2 className="text-lg font-semibold mb-2">
                {house.propertyName ? house.propertyName : 'New Property'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm">Property Name:</label>
                  <input
                    type="text"
                    value={house.propertyName}
                    onChange={(e) => updateHouse(house.id, 'propertyName', e.target.value)}
                    className="w-full border p-1 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm">Property Value:</label>
                  <input
                    type="number"
                    value={house.propertyValue}
                    onChange={(e) => updateHouse(house.id, 'propertyValue', parseFloat(e.target.value))}
                    className="w-full border p-1 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm">Down Payment:</label>
                  <input
                    type="number"
                    value={house.downPayment}
                    onChange={(e) => updateHouse(house.id, 'downPayment', parseFloat(e.target.value))}
                    className="w-full border p-1 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm">Annual Appreciation (%):</label>
                  <input
                    type="number"
                    value={house.annualAppreciation}
                    onChange={(e) => updateHouse(house.id, 'annualAppreciation', parseFloat(e.target.value))}
                    className="w-full border p-1 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm">Property Tax Rate (%):</label>
                  <input
                    type="number"
                    value={house.propertyTaxRate}
                    onChange={(e) => updateHouse(house.id, 'propertyTaxRate', parseFloat(e.target.value))}
                    className="w-full border p-1 rounded"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm">Monthly Rent:</label>
                  <input
                    type="number"
                    value={house.monthlyRent}
                    onChange={(e) => updateHouse(house.id, 'monthlyRent', parseFloat(e.target.value))}
                    className="w-full border p-1 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm">Rental Appreciation (%):</label>
                  <input
                    type="number"
                    value={house.rentalAppreciation}
                    onChange={(e) => updateHouse(house.id, 'rentalAppreciation', parseFloat(e.target.value))}
                    className="w-full border p-1 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm">Mortgage Interest Rate (%):</label>
                  <input
                    type="number"
                    value={house.interestRate}
                    onChange={(e) => updateHouse(house.id, 'interestRate', parseFloat(e.target.value))}
                    className="w-full border p-1 rounded"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm">Loan Term (Years):</label>
                  <select
                    value={house.loanTerm}
                    onChange={(e) => updateHouse(house.id, 'loanTerm', parseInt(e.target.value))}
                    className="w-full border p-1 rounded"
                  >
                    <option value={15}>15 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                </div>
              </div>
              <button
                className="mt-4 p-2 bg-green-500 text-white rounded"
                onClick={() => submitHouse(house.id)}
              >
                Submit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Additional tabs (Graphs, Table, Combined Report) as before */}
      <div className="mt-6">
        <div className="mb-4">
          <div className="flex border-b">
            <button
              className={`py-2 px-4 ${activeTab === 'graph' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
              onClick={() => setActiveTab('graph')}
            >
              Graphs
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'table' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
              onClick={() => setActiveTab('table')}
            >
              Table Data
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'combined' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
              onClick={() => setActiveTab('combined')}
            >
              Combined Report
            </button>
          </div>
        </div>

        {activeTab === 'graph' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Portfolio Property Value & Equity Growth</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={portfolioProjections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="propertyValue" name="Property Value" stroke="#8884d8" />
                    <Line type="monotone" dataKey="equity" name="Equity" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="remainingLoanBalance" name="Loan Balance" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Portfolio Annual Cash Flow & Return</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={portfolioProjections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="annualRentalIncome" name="Rental Income" stroke="#8884d8" />
                    <Line type="monotone" dataKey="cashFlow" name="Cash Flow" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="totalReturn" name="Total Return" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Portfolio Return on Investment (ROI) %</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolioProjections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'ROI %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => formatPercentage(value)} />
                    <Bar dataKey="roi" name="ROI %" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Portfolio Tax & Recapture Estimates</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={portfolioProjections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="propertyTax" name="Property Tax" stroke="#8884d8" />
                    <Line type="monotone" dataKey="recaptureEstimate" name="Recapture Estimate" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'table' && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Year</th>
                  <th className="border p-2">Property Value</th>
                  <th className="border p-2">Equity</th>
                  <th className="border p-2">Rental Income</th>
                  <th className="border p-2">Cash Flow</th>
                  <th className="border p-2">Property Tax</th>
                  <th className="border p-2">Recapture Est.</th>
                  <th className="border p-2">ROI %</th>
                </tr>
              </thead>
              <tbody>
                {portfolioProjections.map((data) => (
                  <tr key={data.year} className={data.year % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="border p-2">{data.year}</td>
                    <td className="border p-2">{formatCurrency(data.propertyValue)}</td>
                    <td className="border p-2">{formatCurrency(data.equity)}</td>
                    <td className="border p-2">{formatCurrency(data.annualRentalIncome)}</td>
                    <td className="border p-2">{formatCurrency(data.cashFlow)}</td>
                    <td className="border p-2">{formatCurrency(data.propertyTax)}</td>
                    <td className="border p-2">{formatCurrency(data.recaptureEstimate)}</td>
                    <td className="border p-2">{formatPercentage(data.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'combined' && (
          <div className="overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Combined Income Report</h2>
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Year</th>
                  <th className="border p-2">Rental Income</th>
                  <th className="border p-2">Cash Flow</th>
                  <th className="border p-2">Recapture Est.</th>
                  <th className="border p-2">Net Combined Income</th>
                </tr>
              </thead>
              <tbody>
                {portfolioProjections.map((data) => {
                  const netCombinedIncome = (data.annualRentalIncome + data.cashFlow) - data.recaptureEstimate;
                  return (
                    <tr key={data.year} className={data.year % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="border p-2">{data.year}</td>
                      <td className="border p-2">{formatCurrency(data.annualRentalIncome)}</td>
                      <td className="border p-2">{formatCurrency(data.cashFlow)}</td>
                      <td className="border p-2">{formatCurrency(data.recaptureEstimate)}</td>
                      <td className="border p-2">{formatCurrency(netCombinedIncome)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioCalculator;