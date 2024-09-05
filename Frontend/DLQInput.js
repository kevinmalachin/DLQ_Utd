import React, { useState } from 'react';

function DLQInput({ handleDLQCheck }) {
  const [dlqText, setDlqText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    handleDLQCheck(dlqText);
  };

  return (
    <div className="first-part">
      <textarea
        className="DLQtext"
        cols="60"
        rows="15"
        placeholder="Insert the content of the DLQ"
        value={dlqText}
        onChange={(e) => setDlqText(e.target.value)}
      />
      <div className="second-part">
        <button onClick={handleSubmit}>Check Reported References</button>
      </div>
    </div>
  );
}

export default DLQInput;
