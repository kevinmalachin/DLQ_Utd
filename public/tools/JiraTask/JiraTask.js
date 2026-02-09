document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:2000`
    : "http://127.0.0.1:2000";

  const checkButton = document.getElementById("checkButton");
  const exportButton = document.getElementById("exportXlsxButton");
  const resultsContainer = document.getElementById("timeline");
  const totalTasksContainer = document.getElementById("totalTasks");
  const loading = document.getElementById("loading");
  const startInput = document.getElementById("startDate");
  const endInput = document.getElementById("endDate");

  console.log("JiraTask.js loaded", { checkButton, exportButton, API_BASE });

  if (!checkButton || !exportButton) {
    console.error("Required buttons not found in DOM");
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (!startInput.value) startInput.value = todayStr;

  const setLoading = (isLoading) => {
    loading.classList.toggle("hidden", !isLoading);
    checkButton.disabled = isLoading;
    exportButton.disabled = isLoading;
  };

  const showMessage = (message) => {
    totalTasksContainer.textContent = message || "";
  };

  const getShiftTimeRange = (shift) => {
    const shiftTimes = {
      morning: { start: "06:00", end: "14:00" },
      afternoon: { start: "14:00", end: "22:00" },
      night: { start: "22:00", end: "06:00" },
    };
    return shiftTimes[shift] || { start: "00:00", end: "23:59" };
  };

  // ✅ GENERATE TIMELINE
  checkButton.addEventListener("click", async () => {
    setLoading(true);
    resultsContainer.innerHTML = "";
    showMessage("");

    const startDate = startInput.value || todayStr;
    const endDate = endInput.value || startDate;
    const project = document.getElementById("projectSelect").value;
    const shift = document.getElementById("shiftSelect").value;
    const agent = document.getElementById("agentSelect").value;
    const includeConfluence = document.getElementById("includeConfluence").checked;
    const confluenceSpace = document.getElementById("confluenceSpaceSelect").value;

    const shiftTimes = getShiftTimeRange(shift);

    try {
      const query = new URLSearchParams({
        startDate,
        endDate,
        project,
        shiftStart: shiftTimes.start,
        shiftEnd: shiftTimes.end,
        agent,
        includeConfluence: includeConfluence ? "true" : "false",
        confluenceSpace,
      }).toString();

      console.log("Calling API:", `${API_BASE}/check-tasks?${query}`);

      const response = await fetch(`${API_BASE}/check-tasks?${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore nel caricamento dati");
      }

      if (Array.isArray(data.results) && data.results.length > 0) {
        showMessage(`Totale Task: ${data.results.length}`);

        data.results.forEach((task) => {
          const item = document.createElement("div");
          item.classList.add("timeline-item");

          item.innerHTML = `
            <div class="timeline-time">${task.updated}</div>
            <div class="timeline-content">
              <a href="${task.task_link}" target="_blank">${task.task_name}</a>
              <p>${task.summary}</p>
              <ul>
                ${task.activities
                  .map(a => `<li><b>${a.field}</b>: ${a.from || ""} → ${a.to || ""}</li>`)
                  .join("")}
              </ul>
            </div>
          `;
          resultsContainer.appendChild(item);
        });
      } else {
        showMessage("Totale Task: 0");
        resultsContainer.innerHTML = "<p>Nessun dato trovato.</p>";
      }
    } catch (err) {
      console.error(err);
      resultsContainer.innerHTML = `<p>Errore: ${err.message}</p>`;
    } finally {
      setLoading(false);
    }
  });

  // ✅ EXPORT XLSX
  exportButton.addEventListener("click", () => {
    const startDate = startInput.value || todayStr;
    const endDate = endInput.value || startDate;
    const project = document.getElementById("projectSelect").value;
    const shift = document.getElementById("shiftSelect").value;
    const agent = document.getElementById("agentSelect").value;
    const includeConfluence = document.getElementById("includeConfluence").checked;
    const confluenceSpace = document.getElementById("confluenceSpaceSelect").value;

    const shiftTimes = getShiftTimeRange(shift);

    const query = new URLSearchParams({
      startDate,
      endDate,
      project,
      shiftStart: shiftTimes.start,
      shiftEnd: shiftTimes.end,
      agent,
      includeConfluence: includeConfluence ? "true" : "false",
      confluenceSpace,
    }).toString();

    window.open(`${API_BASE}/export-xlsx?${query}`, "_blank");
  });
});
