import React, { useState, useEffect, useCallback } from 'react';

// Main App component for the Retirement Calculator
function App() {
  // State variables for all user inputs
  const [presentLumpsum, setPresentLumpsum] = useState('');
  const [monthlyInvestable, setMonthlyInvestable] = useState('');
  const [presentPFValue, setPresentPFValue] = useState('');
  const [monthlyPFInvestment, setMonthlyPFInvestment] = useState('');
  const [cagrInvested, setCagrInvested] = useState('');
  const [cagrPF, setCagrPF] = useState('');
  const [currentAge, setCurrentAge] = useState('');
  const [retirementAge, setRetirementAge] = useState('');
  const [inflationRate, setInflationRate] = useState('');
  const [annualInvestmentIncrease, setAnnualInvestmentIncrease] = useState('');
  const [annualPFIncrease, setAnnualPFIncrease] = useState('');
  const [desiredAnnualIncome, setDesiredAnnualIncome] = useState('');
  const [lifeExpectancy, setLifeExpectancy] = useState('');
  const [cagrInvestedAfterRetirement, setCagrInvestedAfterRetirement] = useState('');

  // State variables for calculation results and messages
  const [totalAccumulatedCorpus, setTotalAccumulatedCorpus] = useState(null);
  const [requiredCorpus, setRequiredCorpus] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [llmSuggestions, setLlmSuggestions] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);


  // Function to perform the retirement calculations
  const calculateRetirement = useCallback(() => {
    setError(''); // Clear previous errors
    setMessage(''); // Clear previous messages
    setLlmSuggestions(''); // Clear previous suggestions

    // Parse all input values as numbers
    const pLumpsum = parseFloat(presentLumpsum);
    const mInvestable = parseFloat(monthlyInvestable);
    const pPFValue = parseFloat(presentPFValue);
    const mPFInvestment = parseFloat(monthlyPFInvestment);
    const rInvested = parseFloat(cagrInvested) / 100; // Convert to decimal
    const rPF = parseFloat(cagrPF) / 100; // Convert to decimal
    const cAge = parseInt(currentAge);
    const rAge = parseInt(retirementAge);
    const inflRate = parseFloat(inflationRate) / 100; // Convert to decimal
    const annInvIncrease = parseFloat(annualInvestmentIncrease) / 100; // Convert to decimal
    const annPFIncrease = parseFloat(annualPFIncrease) / 100; // Convert to decimal
    const dAnnualIncome = parseFloat(desiredAnnualIncome);
    const lExpectancy = parseInt(lifeExpectancy);
    const rInvestedAfterRetirement = parseFloat(cagrInvestedAfterRetirement) / 100; // Convert to decimal

    // Validate inputs
    if (isNaN(pLumpsum) || isNaN(mInvestable) || isNaN(pPFValue) || isNaN(mPFInvestment) ||
        isNaN(rInvested) || isNaN(rPF) || isNaN(cAge) || isNaN(rAge) || isNaN(inflRate) ||
        isNaN(annInvIncrease) || isNaN(annPFIncrease) || isNaN(dAnnualIncome) || isNaN(lExpectancy) ||
        isNaN(rInvestedAfterRetirement)) {
      setError('Please fill in all fields with valid numbers.');
      return;
    }

    if (cAge >= rAge) {
      setError('Retirement Age must be greater than Current Age.');
      return;
    }
    if (lExpectancy <= 0) {
      setError('Life Expectancy in Retirement must be a positive number.');
      return;
    }

    const yearsToRetirement = rAge - cAge;
    let totalCorpus = 0;

    // 1. Future Value of Present Lumpsum Amount
    const fvLumpsum = pLumpsum * Math.pow((1 + rInvested), yearsToRetirement);
    totalCorpus += fvLumpsum;

    // 2. Future Value of Monthly Investable Money (with annual increase)
    let currentAnnualInvestment = mInvestable * 12;
    let fvMonthlyInvestable = 0;
    for (let i = 0; i < yearsToRetirement; i++) {
      fvMonthlyInvestable += currentAnnualInvestment * Math.pow((1 + rInvested), (yearsToRetirement - 1 - i));
      currentAnnualInvestment *= (1 + annInvIncrease);
    }
    totalCorpus += fvMonthlyInvestable;

    // 3. Future Value of Present PF Value
    const fvPFValue = pPFValue * Math.pow((1 + rPF), yearsToRetirement);
    totalCorpus += fvPFValue;

    // 4. Future Value of Monthly Investment in PF (with annual increase)
    let currentAnnualPFInvestment = mPFInvestment * 12;
    let fvMonthlyPFInvestment = 0;
    for (let i = 0; i < yearsToRetirement; i++) {
      fvMonthlyPFInvestment += currentAnnualPFInvestment * Math.pow((1 + rPF), (yearsToRetirement - 1 - i));
      currentAnnualPFInvestment *= (1 + annPFIncrease);
    }
    totalCorpus += fvMonthlyPFInvestment;

    setTotalAccumulatedCorpus(totalCorpus);

    // Calculate Required Corpus
    // Desired Annual Income at Retirement (inflation-adjusted)
    const desiredIncomeAtRetirement = dAnnualIncome * Math.pow((1 + inflRate), yearsToRetirement);

    // Real Rate of Return After Retirement
    const realRateAfterRetirement = ((1 + rInvestedAfterRetirement) / (1 + inflRate)) - 1;

    let calculatedRequiredCorpus = 0;
    if (realRateAfterRetirement > 0) {
      // Present Value of an Annuity formula for required corpus
      calculatedRequiredCorpus = desiredIncomeAtRetirement *
                                 (1 - Math.pow((1 + realRateAfterRetirement), -lExpectancy)) /
                                 realRateAfterRetirement;
    } else if (realRateAfterRetirement === 0) {
        // If real rate is 0, corpus needed is simply desired income multiplied by life expectancy
        calculatedRequiredCorpus = desiredIncomeAtRetirement * lExpectancy;
    } else {
        // If real rate is negative, a more complex scenario, or a very high corpus is needed.
        // For simplicity, we can cap it or provide a warning.
        // In a real negative real rate scenario, the corpus would deplete faster.
        // Let's assume a simpler linear depletion for negative real rates for now,
        // or a very large number to indicate insufficiency without complex math.
        // A simple approach for negative real rate: if each year you withdraw more in real terms than you earn,
        // it means you're just drawing down the principal faster.
        // Let's stick with the PV formula and assume it handles negative real rates by yielding a larger required corpus.
        // However, a negative real rate means your money is losing purchasing power faster than it grows.
        // The standard formula for PV of an annuity works even with negative rates but yields a smaller required corpus.
        // This is counterintuitive for a 'safe withdrawal' scenario.
        // A more practical approach for negative real rate: you need to account for the increasing withdrawal due to inflation
        // and the diminishing value of the remaining corpus.
        // For simplicity, let's assume a large, perhaps infinite, corpus is required for sustainable income if real rate is negative.
        // Or, we assume a continuous depletion where you just need X years of expenses in inflation-adjusted terms.
        // Let's use a simpler approach for negative real rate that ensures depletion:
        // Assume you need to cover `lExpectancy` years of `desiredIncomeAtRetirement` (which is inflation-adjusted).
        // If the real return is negative, your money essentially shrinks. So, you'll need at least the sum of all future
        // inflation-adjusted withdrawals. This is a very rough approximation.
        // For a robust calculator, if realRateAfterRetirement is negative, it's a critical scenario.
        // Let's use the current formula, but give a warning if realRateAfterRetirement is negative.
        calculatedRequiredCorpus = desiredIncomeAtRetirement *
                                 (1 - Math.pow((1 + realRateAfterRetirement), -lExpectancy)) /
                                 realRateAfterRetirement;
        if (realRateAfterRetirement < 0) {
            setMessage(prev => prev + " Warning: Your expected return after retirement is less than the inflation rate, which means your money will lose purchasing power. You might need a significantly larger corpus or adjust your expectations for retirement income.");
        }
    }


    setRequiredCorpus(calculatedRequiredCorpus);

    if (totalCorpus >= calculatedRequiredCorpus) {
      const surplus = totalCorpus - calculatedRequiredCorpus;
      setMessage(`Congratulations! Your estimated retirement corpus of ₹${totalCorpus.toLocaleString('en-IN', { maximumFractionDigits: 0 })} is sufficient. You have a surplus of ₹${surplus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.`);
    } else {
      const deficit = calculatedRequiredCorpus - totalCorpus;
      setMessage(`Warning: Your estimated retirement corpus of ₹${totalCorpus.toLocaleString('en-IN', { maximumFractionDigits: 0 })} is not sufficient. You need an additional ₹${deficit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} to meet your retirement goals.`);
    }
  }, [presentLumpsum, monthlyInvestable, presentPFValue, monthlyPFInvestment, cagrInvested, cagrPF, currentAge, retirementAge, inflationRate, annualInvestmentIncrease, annualPFIncrease, desiredAnnualIncome, lifeExpectancy, cagrInvestedAfterRetirement]);

  // Function to get LLM-powered suggestions
  const getLLMSuggestions = useCallback(async () => {
    if (totalAccumulatedCorpus === null || requiredCorpus === null) {
      setError('Please calculate your retirement outlook first before getting suggestions.');
      return;
    }
    setLoadingSuggestions(true);
    setLlmSuggestions(''); // Clear previous suggestions

    const yearsToRetirement = parseInt(retirementAge) - parseInt(currentAge);

    // Construct the prompt for the LLM
    const prompt = `As a retirement planning assistant, analyze the following user's retirement calculation:
Current Age: ${currentAge}
Retirement Age: ${retirementAge}
Years to Retirement: ${yearsToRetirement}
Estimated Accumulated Corpus: ₹${totalAccumulatedCorpus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
Required Corpus: ₹${requiredCorpus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
Outcome: ${message}

Based on this, provide actionable and helpful suggestions to help the user achieve their retirement goals. If there's a deficit, suggest ways to bridge the gap (e.g., increase savings, extend working years, adjust expectations). If there's a surplus, suggest ways to utilize it (e.g., early retirement, enhanced lifestyle, legacy planning). Keep the suggestions concise and encouraging. Provide 3-5 distinct points.`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiKey = ""; // Canvas will automatically provide API key here
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setLlmSuggestions(text);
      } else {
        setError('Failed to get suggestions from the AI. Please try again.');
      }
    } catch (err) {
      console.error("Error calling Gemini API:", err);
      setError('An error occurred while fetching AI suggestions. Please check your network connection or try again later.');
    } finally {
      setLoadingSuggestions(false);
    }
  }, [totalAccumulatedCorpus, requiredCorpus, message, currentAge, retirementAge]);


  // Helper function to format numbers to Indian Rupees
  const formatCurrency = (value) => {
    if (value === null || isNaN(value)) {
      return '';
    }
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-indigo-200">
        <h1 className="text-3xl font-extrabold text-center text-indigo-800 mb-8 font-inter">Retirement Calculator</h1>

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Section: Your Current Financials */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 border-indigo-300">Your Current Financials</h2>
          </div>
          <div>
            <label htmlFor="presentLumpsum" className="block text-sm font-medium text-gray-700 mb-1">Present Lumpsum Amount (₹)</label>
            <input
              type="number"
              id="presentLumpsum"
              value={presentLumpsum}
              onChange={(e) => setPresentLumpsum(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 5000000"
            />
          </div>
          <div>
            <label htmlFor="monthlyInvestable" className="block text-sm font-medium text-gray-700 mb-1">Monthly Investable Money (₹)</label>
            <input
              type="number"
              id="monthlyInvestable"
              value={monthlyInvestable}
              onChange={(e) => setMonthlyInvestable(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 30000"
            />
          </div>
          <div>
            <label htmlFor="presentPFValue" className="block text-sm font-medium text-gray-700 mb-1">Present PF Value (₹)</label>
            <input
              type="number"
              id="presentPFValue"
              value={presentPFValue}
              onChange={(e) => setPresentPFValue(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 1000000"
            />
          </div>
          <div>
            <label htmlFor="monthlyPFInvestment" className="block text-sm font-medium text-gray-700 mb-1">Monthly Investment in PF (₹)</label>
            <input
              type="number"
              id="monthlyPFInvestment"
              value={monthlyPFInvestment}
              onChange={(e) => setMonthlyPFInvestment(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 15000"
            />
          </div>

          {/* Section: Growth Expectations */}
          <div className="col-span-1 md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 border-indigo-300">Growth Expectations</h2>
          </div>
          <div>
            <label htmlFor="cagrInvested" className="block text-sm font-medium text-gray-700 mb-1">Expected CAGR on Invested Amount (%)</label>
            <input
              type="number"
              id="cagrInvested"
              value={cagrInvested}
              onChange={(e) => setCagrInvested(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 12"
            />
          </div>
          <div>
            <label htmlFor="cagrPF" className="block text-sm font-medium text-gray-700 mb-1">Expected CAGR on PF (%)</label>
            <input
              type="number"
              id="cagrPF"
              value={cagrPF}
              onChange={(e) => setCagrPF(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 7.5"
            />
          </div>
          <div>
            <label htmlFor="annualInvestmentIncrease" className="block text-sm font-medium text-gray-700 mb-1">Annual Increase of Investment (%)</label>
            <input
              type="number"
              id="annualInvestmentIncrease"
              value={annualInvestmentIncrease}
              onChange={(e) => setAnnualInvestmentIncrease(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 5"
            />
          </div>
          <div>
            <label htmlFor="annualPFIncrease" className="block text-sm font-medium text-gray-700 mb-1">Annual Increase of PF (%)</label>
            <input
              type="number"
              id="annualPFIncrease"
              value={annualPFIncrease}
              onChange={(e) => setAnnualPFIncrease(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 5"
            />
          </div>
          <div>
            <label htmlFor="inflationRate" className="block text-sm font-medium text-gray-700 mb-1">Inflation Rate (%)</label>
            <input
              type="number"
              id="inflationRate"
              value={inflationRate}
              onChange={(e) => setInflationRate(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 5"
            />
          </div>
          <div>
            <label htmlFor="cagrInvestedAfterRetirement" className="block text-sm font-medium text-gray-700 mb-1">Expected CAGR after Retirement (%)</label>
            <input
              type="number"
              id="cagrInvestedAfterRetirement"
              value={cagrInvestedAfterRetirement}
              onChange={(e) => setCagrInvestedAfterRetirement(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 6"
            />
          </div>

          {/* Section: Retirement Timeline & Lifestyle */}
          <div className="col-span-1 md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2 border-indigo-300">Retirement Timeline & Lifestyle</h2>
          </div>
          <div>
            <label htmlFor="currentAge" className="block text-sm font-medium text-gray-700 mb-1">Current Age</label>
            <input
              type="number"
              id="currentAge"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 30"
            />
          </div>
          <div>
            <label htmlFor="retirementAge" className="block text-sm font-medium text-gray-700 mb-1">Expected Retirement Age</label>
            <input
              type="number"
              id="retirementAge"
              value={retirementAge}
              onChange={(e) => setRetirementAge(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 60"
            />
          </div>
          <div>
            <label htmlFor="desiredAnnualIncome" className="block text-sm font-medium text-gray-700 mb-1">Desired Annual Income in Retirement (Today's ₹)</label>
            <input
              type="number"
              id="desiredAnnualIncome"
              value={desiredAnnualIncome}
              onChange={(e) => setDesiredAnnualIncome(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 750000"
            />
          </div>
          <div>
            <label htmlFor="lifeExpectancy" className="block text-sm font-medium text-gray-700 mb-1">Life Expectancy in Retirement (Years)</label>
            <input
              type="number"
              id="lifeExpectancy"
              value={lifeExpectancy}
              onChange={(e) => setLifeExpectancy(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., 25"
            />
          </div>
        </div>

        {/* Calculation Button */}
        <button
          onClick={calculateRetirement}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Calculate Retirement
        </button>

        {/* Error Message Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results Display */}
        {totalAccumulatedCorpus !== null && requiredCorpus !== null && !error && (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">Your Retirement Outlook</h2>
            <div className="space-y-3">
              <p className="text-lg text-gray-800">
                <span className="font-semibold">Estimated Accumulated Corpus:</span> {formatCurrency(totalAccumulatedCorpus)}
              </p>
              <p className="text-lg text-gray-800">
                <span className="font-semibold">Required Corpus for Desired Income:</span> {formatCurrency(requiredCorpus)}
              </p>
              <p className={`text-xl font-bold ${totalAccumulatedCorpus >= requiredCorpus ? 'text-green-700' : 'text-red-700'}`}>
                {message}
              </p>
            </div>

            {/* AI Suggestions Button */}
            <button
              onClick={getLLMSuggestions}
              disabled={loadingSuggestions}
              className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSuggestions ? 'Getting Suggestions...' : 'Get Retirement Suggestions ✨'}
            </button>

            {/* AI Suggestions Display */}
            {llmSuggestions && (
              <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg shadow-inner">
                <h3 className="text-xl font-bold text-green-800 mb-3">AI Retirement Suggestions:</h3>
                <div className="prose max-w-none text-gray-700">
                  {llmSuggestions.split('\n').map((line, index) => (
                    // Render paragraphs or list items if the AI uses markdown lists
                    line.trim().startsWith('-') ? (
                      <p key={index} className="mb-1 ml-4 before:content-['•'] before:absolute before:-ml-4 before:text-green-700">{line.substring(1).trim()}</p>
                    ) : (
                      <p key={index} className="mb-1">{line}</p>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Example Input Suggestions (Optional, for first-time users) */}
        <div className="mt-8 text-sm text-gray-600 border-t pt-4 border-gray-200">
          <p className="font-semibold mb-2">Example Inputs (You can use these to test):</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Present Lumpsum: 5000000</li>
            <li>Monthly Investable: 30000</li>
            <li>Present PF Value: 1000000</li>
            <li>Monthly PF Investment: 15000</li>
            <li>CAGR on Invested: 12%</li>
            <li>CAGR on PF: 7.5%</li>
            <li>Current Age: 30</li>
            <li>Retirement Age: 60</li>
            <li>Inflation Rate: 5%</li>
            <li>Annual Investment Increase: 5%</li>
            <li>Annual PF Increase: 5%</li>
            <li>Desired Annual Income: 750000</li>
            <li>Life Expectancy in Retirement: 25</li>
            <li>CAGR after Retirement: 6%</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
