import React, { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar"; // Import the Sidebar
import DLQInput from "./components/DLQInput";
import Results from "./components/Results";

function App() {
  const [extractedReferences, setExtractedReferences] = useState([]);
  const [reportedRefs, setReportedRefs] = useState([]);
  const [nonReportedRefs, setNonReportedRefs] = useState([]);
  const [reportedTasks, setReportedTasks] = useState([]);
  const [error, setError] = useState(null);

  const handleExtract = (dlqText) => {
    setError(null); // Reset error on new extract
    const dlqMatch = dlqText.match(/(\S+)\.DLQ/);
    if (!dlqMatch) {
      setError("No DLQ identified in the text.");
      return;
    }
    const currentDLQ = dlqMatch[1];

    let patterns = [];
    switch (true) {
      case /fluent\.returns\.creditmemos/.test(currentDLQ):
        patterns = [/\"ref\":\s*\"(CM_[^\"]+)\"/g];
        break;
      case /orderlifecycle\.sendpartialrefund/.test(currentDLQ):
        patterns = [/\"entityRef\":\s*\"(CM_[^\"]+)\"/g];
        break;
      case /process\.goods-receptions/.test(currentDLQ):
        patterns = [/\"asnType\":\s*\"([A-Z]+)\"/g, /\"asnId\":\s*\"(\d+)\"/g];
        break;
      case /process\.generateinvoice/.test(currentDLQ):
        patterns = [/\"internalReference\":\s*\"(EC0[^\"]+)\"/g];
        break;
      case /orderlifecycle\.LTReserveFulfilment/.test(currentDLQ):
      case /orderlifecycle\.LTRejectFulfilment/.test(currentDLQ):
      case /orderlifecycle\.LTValidateFulfilment/.test(currentDLQ):
        patterns = [/\"rootEntityRef\":\s*\"(FR\d+|EC\d+)\"/g];
        break;
      case /emea\.orderlifecycle\.createLabelSAV/.test(currentDLQ):
        patterns = [/\"entityRef\":\s*\"(EC\d+-R\d+)\"/g];
        break;
      case /emea\.m51au\.process/.test(currentDLQ):
      case /apac\.orderlifecycle\.dhl\.kr\.delivery/.test(currentDLQ):
        patterns = [/\"REFLIV\":\s*\"(EC\d+-\d+)\"/g];
        break;
      case /emea\.eboutique\.order/.test(currentDLQ):
        patterns = [/\"externalReference\":\s*\"(EC\d+)\"/g];
        break;
      case /emea\.orderlifecycle\.fullordercancellation/.test(currentDLQ):
        patterns = [/\"entityRef\":\s*\"(EC\d+)\"/g];
        break;
      default:
        setError("No matching DLQ pattern found.");
        return;
    }

    let combinedReferences = [];
    patterns.forEach((pattern) => {
      const matches = [...dlqText.matchAll(pattern)];
      combinedReferences.push(...matches.map((match) => match[1]));
    });

    const filteredReferences = [...new Set(combinedReferences)].filter(
      (ref) => !ref.endsWith("-STD")
    );
    setExtractedReferences(filteredReferences);
  };

  const handleCheck = async () => {
    if (extractedReferences.length === 0) {
      setError("Please extract references first.");
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
      const data = await response.json();
      const { output } = data;

      const nonReported = output.non_reported;
      const reportedTasksData = Object.entries(output.reported).map(
        ([incident, details]) => ({
          task_name: details.task_name,
          task_link: details.task_link,
          summary: details.summary,
          task_status: details.task_status,
          references: details.references,
        })
      );

      setReportedRefs(output.reported_count);
      setNonReportedRefs(nonReported);
      setReportedTasks(reportedTasksData);
    } catch (error) {
      console.error(error);
      setError("Failed to connect to the server.");
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
          reportedTasks={reportedTasks}
          error={error}
        />
      </div>
    </div>
  );
}

export default App;
