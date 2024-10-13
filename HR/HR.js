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
  const messages = dlqText.split(/ID\s+/); // Divide i messaggi in base a "ID"
  let extractedData = [];

  // Itera attraverso i messaggi per estrarre i campi
  messages.forEach((message) => {
    const eventIdMatch = message.match(/([a-f0-9-]{36})/); // Cerca l'eventID come UUID
    const errorTypeMatch = message.match(/errorType\s+([^\n]+)/);
    const errorMessageMatch = message.match(/errorMessage\s+([\s\S]+?)(?=\n\S|$)/); // Prende il messaggio su più righe
    const errorCodeMatch = message.match(/errorCode\s+(\d+)/);

    // Crea un oggetto per i campi estratti e aggiungilo all'array
    extractedData.push({
      eventId: eventIdMatch ? eventIdMatch[1].trim() : "N/A",
      errorType: errorTypeMatch ? errorTypeMatch[1].trim() : "N/A",
      errorMessage: errorMessageMatch ? errorMessageMatch[1].trim() : "N/A",
      errorCode: errorCodeMatch ? errorCodeMatch[1].trim() : "N/A",
    });
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