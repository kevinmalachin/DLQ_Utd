import React, { useState } from "react";

const DLQInput = ({ onExtract, onCheck }) => {
  const [dlqText, setDlqText] = useState("");

  return (
    <div className="dlq-input-container">
      <h2>DLQ Reference Extractor</h2>
      <textarea
        className="dlq-textarea"
        placeholder="Insert the content of the DLQ"
        rows="10"
        value={dlqText}
        onChange={(e) => setDlqText(e.target.value)}
      />
      <div className="button-group">
        <button className="btn" onClick={() => onExtract(dlqText)}>
          Extract References
        </button>
        <button className="btn" onClick={onCheck}>
          Check Reported References
        </button>
      </div>
    </div>
  );
};

export default DLQInput;
