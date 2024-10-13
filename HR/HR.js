document.getElementById("generateExcel").addEventListener("click", function () {
  const dlqText = document.getElementById("dlqInput").value;

  if (!dlqText) {
    alert("Please paste DLQ content.");
    return;
  }

  // Estrai il nome della DLQ dal testo incollato
  const dlqQueueName = extractDLQName(dlqText);

  // Funzione per estrarre i campi che ci interessano
  const extractedData = extractDLQFields(dlqText);

  // Genera e scarica l'Excel
  generateExcelFile(extractedData, dlqQueueName);
});

function extractDLQName(dlqText) {
  // Estrai il nome della DLQ dal testo
  const dlqMatch = dlqText.match(/(prod\.[a-zA-Z0-9._-]+\.DLQ)/);
  return dlqMatch ? dlqMatch[1] : "DLQ_File";
}

function extractDLQFields(dlqText) {
  const lines = dlqText.split("\n");
  let extractedData = [];

  // Inizializza variabili per i campi che ci interessano
  let eventId = "N/A";
  let errorType = "N/A";
  let errorMessage = "N/A";
  let errorCode = "N/A";

  // Itera attraverso le linee per estrarre i campi
  lines.forEach((line) => {
    // Cerca l'Event ID (formato UUID)
    const eventIdMatch = line.match(/\b([a-f0-9-]{36})\b/);
    if (eventIdMatch) {
      eventId = eventIdMatch[1].trim();
    }

    // Cerca l'Error Type
    const errorTypeMatch = line.match(/errorType\s*:\s*([^\n]+)/);
    if (errorTypeMatch) {
      errorType = errorTypeMatch[1].trim();
    }

    // Cerca l'Error Message (considera più righe)
    const errorMessageMatch = line.match(/errorMessage\s*:\s*([\s\S]+?)(?=errorCode|MULE_ENCODING|\n\S)/);
    if (errorMessageMatch) {
      errorMessage = errorMessageMatch[1].trim();
    }

    // Cerca l'Error Code
    const errorCodeMatch = line.match(/errorCode\s*:\s*(\d+)/);
    if (errorCodeMatch) {
      errorCode = errorCodeMatch[1].trim();
    }

    // Quando troviamo un Event ID o altri campi, consideriamo il blocco completato e aggiungiamo i dati
    if (eventId !== "N/A" || errorType !== "N/A" || errorMessage !== "N/A" || errorCode !== "N/A") {
      extractedData.push({
        eventId,
        errorType,
        errorMessage,
        errorCode,
      });

      // Resetta i campi per il prossimo blocco
      eventId = "N/A";
      errorType = "N/A";
      errorMessage = "N/A";
      errorCode = "N/A";
    }
  });

  return extractedData;
}

// Funzione per generare l'Excel usando SheetJS
function generateExcelFile(data, dlqQueueName) {
  // Definisci le colonne dell'Excel
  const worksheetData = [
    ["Event ID", "Error Type", "Error Message", "Error Code"],
  ];

  // Aggiungi i dati estratti
  data.forEach((row) => {
    worksheetData.push([
      row.eventId,
      row.errorType,
      row.errorMessage,
      row.errorCode,
    ]);
  });

  // Crea un nuovo foglio di lavoro
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Crea una nuova cartella di lavoro (workbook)
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DLQ Data");

  // Genera il file Excel con il nome della DLQ
  XLSX.writeFile(workbook, `${dlqQueueName}.xlsx`);
}