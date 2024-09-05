import React, { useState } from 'react';
import DLQInput from './components/DLQInput';
import ResultDisplay from './components/ResultDisplay';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDLQCheck = async (dlqText) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/run-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ references: dlqText }),
      });

      const data = await response.json();
      setResults(data.output); // Assuming your backend returns `output` as the key.
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <nav className="navbar">
        <button id="menuButton" onClick={() => alert('Menu functionality coming soon!')}>Menu</button>
        <div id="menu" className="hidden">
          <ul>
            <li><a href="/support-scope" target="_blank">Support Scope</a></li>
          </ul>
        </div>
      </nav>
      <div className="container">
        <DLQInput handleDLQCheck={handleDLQCheck} />
        {loading ? <p>Loading...</p> : <ResultDisplay results={results} />}
      </div>
    </div>
  );
}

export default App;
