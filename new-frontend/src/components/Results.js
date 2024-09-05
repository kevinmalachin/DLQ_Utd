import React from "react";

const Results = ({
  extractedReferences,
  reportedRefs,
  nonReportedRefs,
  error,
}) => {
  return (
    <div className="results-container">
      <h2 className="results-title">Results</h2>

      {error && <div className="error">{error}</div>}

      <div className="results-section">
        <h3 className="results-subtitle">Extracted References</h3>
        <ul className="results-list">
          {extractedReferences.length > 0 ? (
            extractedReferences.map((ref, index) => <li key={index}>{ref}</li>)
          ) : (
            <li>No references extracted.</li>
          )}
        </ul>
      </div>

      <div className="results-section">
        <h3 className="results-subtitle">Reported References</h3>
        <ul className="results-list">
          {reportedRefs.length > 0 ? (
            reportedRefs.map((ref, index) => <li key={index}>{ref}</li>)
          ) : (
            <li>No reported references found.</li>
          )}
        </ul>
      </div>

      <div className="results-section">
        <h3 className="results-subtitle">Non-Reported References</h3>
        <ul className="results-list">
          {nonReportedRefs.length > 0 ? (
            nonReportedRefs.map((ref, index) => (
              <li key={index} style={{ color: "red" }}>
                {ref}
              </li>
            ))
          ) : (
            <li>All references are reported.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Results;
