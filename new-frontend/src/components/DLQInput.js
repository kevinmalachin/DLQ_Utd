import React, { useState, useRef } from "react";

const DLQInput = ({ onExtract, onCheck }) => {
  const [dlqText, setDlqText] = useState("");
  const textareaRef = useRef(null);

  const handleInputChange = (e) => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto"; // Resetta l'altezza per ricalcolare
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      window.innerHeight * 0.8
    )}px`; // Limita all'80% dell'altezza
    setDlqText(e.target.value);
  };

  const handleExtractClick = () => {
    if (!dlqText.trim()) {
      alert("Please enter DLQ content.");
      return;
    }
    onExtract(dlqText);
  };

  return (
    <div className="dlq-input-container">
      <h2>DLQ Reference Extractor</h2>
      <textarea
        ref={textareaRef}
        className="dlq-textarea"
        placeholder="Insert the content of the DLQ"
        rows="10"
        value={dlqText}
        onChange={handleInputChange}
      />
      <div className="button-group">
        <button className="btn" onClick={handleExtractClick}>
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
