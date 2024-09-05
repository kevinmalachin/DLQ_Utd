import React, { useState } from "react";
import "./App.css";
import DLQInput from "./components/DLQInput";
import Results from "./components/Results";
import Sidebar from "./components/Sidebar";

function App() {
  const [extractedReferences, setExtractedReferences] = useState([]);
  const [reportedRefs, setReportedRefs] = useState([]);
  const [nonReportedRefs, setNonReportedRefs] = useState([]);
  const [error, setError] = useState(null);

  const handleExtract = (dlqText) => {
    const refs = dlqText.match(/(EC\d+-\d+|CM_[^\"]+)/g) || [];
    setExtractedReferences(refs);
  };

  const handleCheck = async () => {
    if (extractedReferences.length === 0) {
      alert("Please extract references first.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ references: extractedReferences }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the server");
      }

      const data = await response.json();
      const { output } = data;

      if (!output) {
        throw new Error("Invalid server response");
      }

      const reported = output.reported || {};
      const nonReported = output.non_reported || [];

      setReportedRefs(Object.values(reported));
      setNonReportedRefs(nonReported);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="App">
      <Sidebar />
      <div className="container">
        <DLQInput onExtract={handleExtract} onCheck={handleCheck} />
        <Results
          extractedReferences={extractedReferences}
          reportedRefs={reportedRefs}
          nonReportedRefs={nonReportedRefs}
          error={error}
        />
      </div>
    </div>
  );
}

export default App;
