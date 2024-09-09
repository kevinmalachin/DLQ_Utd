import React, { useState } from "react";
import "../App.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Button to toggle sidebar */}
      <button className="menu-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Close Menu" : "Open Menu"}
      </button>

      {/* Sidebar itself */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <ul>
          <li>
            <a href="./SupportScope/SupportScope.html" target="_blank">
              Support Scope
            </a>
          </li>
          {/* Additional menu items can go here */}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
