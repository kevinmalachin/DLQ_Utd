import React, { useState } from "react";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <ul>
        <li onClick={() => setIsOpen(!isOpen)}>Toggle Sidebar</li>
      </ul>
      <button className="toggle-sidebar-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Close" : "Open"}
      </button>
    </div>
  );
};

export default Sidebar;
