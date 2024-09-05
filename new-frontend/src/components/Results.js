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

      <div className="results-title">Extracted References</div>
      <ul className="results-list">
        {extractedReferences.map((ref, index) => (
          <li key={index}>{ref}</li>
        ))}
      </ul>

      <div className="results-title">Reported References</div>
      <ul className="results-list">
        {reportedRefs.length > 0 ? (
          reportedRefs.map((item, index) => (
            <li key={index}>
              <strong>{item.task_name}:</strong> {item.summary}
            </li>
          ))
        ) : (
          <li>No reported references found.</li>
        )}
      </ul>

      <div className="results-title">Non-Reported References</div>
      <ul className="results-list">
        {nonReportedRefs.length > 0 ? (
          nonReportedRefs.map((ref, index) => (
            <li key={index} style={{ color: "red" }}>
              {ref}
            </li>
          ))
        ) : (
          <li>No non-reported references found.</li>
        )}
      </ul>
    </div>
  );
};

export default Results;
