import React from "react";

const Results = ({
  extractedReferences,
  reportedRefs,
  nonReportedRefs,
  reportedTasks,
  error,
}) => {
  return (
    <div className="results-container">
      <h2 className="results-title">Results</h2>

      {error && <div className="error">{error}</div>}

      {/* Extracted References Section with Count */}
      <div className="results-section">
        <h3 className="results-subtitle" style={{ color: "#0070f3" }}>
          Extracted References ({extractedReferences.length})
        </h3>
        <ul className="results-list">
          {extractedReferences.length > 0 ? (
            extractedReferences.map((ref, index) => <li key={index}>{ref}</li>)
          ) : (
            <li>No references extracted.</li>
          )}
        </ul>
      </div>

      {/* Reported References Section with Count */}
      <div className="results-section">
        <h3 className="results-subtitle" style={{ color: "green" }}>
          Reported References ({reportedTasks ? reportedTasks.length : 0})
        </h3>
        <ul className="results-list">
          {reportedTasks && reportedTasks.length > 0 ? (
            reportedTasks.map((task, index) => (
              <li key={index}>
                <strong>
                  <a href={task.task_link} target="_blank" rel="noreferrer">
                    {task.task_name} - {task.summary}
                  </a>
                </strong>{" "}
                ({task.task_status})
                <ul>
                  {task.references.map((ref, i) => (
                    <li key={i}>{ref}</li>
                  ))}
                </ul>
              </li>
            ))
          ) : (
            <li>No reported references found.</li>
          )}
        </ul>
      </div>

      {/* Non-Reported References Section with Count */}
      <div className="results-section">
        <h3 className="results-subtitle" style={{ color: "red" }}>
          Non-Reported References ({nonReportedRefs.length})
        </h3>
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