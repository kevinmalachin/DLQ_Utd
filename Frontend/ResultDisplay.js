import React from 'react';

function ResultDisplay({ results }) {
  if (!results || results.length === 0) {
    return <p>No results to display.</p>;
  }

  const reportedReferences = results.reported || [];
  const nonReportedReferences = results.non_reported || [];

  return (
    <div className="results">
      <h3>Total References Found: {reportedReferences.length + nonReportedReferences.length}</h3>
      <h4>Reported References:</h4>
      <ul>
        {reportedReferences.map((ref, index) => (
          <li key={index} style={{ color: 'green', fontWeight: 'bold' }}>{ref}</li>
        ))}
      </ul>

      <h4>Non-reported References:</h4>
      <ul>
        {nonReportedReferences.map((ref, index) => (
          <li key={index} style={{ color: 'red', fontWeight: 'bold' }}>{ref}</li>
        ))}
      </ul>
    </div>
  );
}

export default ResultDisplay;
