document.getElementById("generateExcel").addEventListener("click", function () {
  const dlqText = document.getElementById("dlqInput").value;

  if (!dlqText) {
    alert("Please paste DLQ content.");
    return;
  }

  // Funzione per estrarre i campi che ci interessano
  const extractedData = extractDLQFields(dlqText);

  // Genera e scarica l'Excel
  generateExcelFile(extractedData);
});

function extractDLQFields(dlqText) {
  const lines = dlqText.split("\n");
  let extractedData = [];

  // Itera attraverso le linee per estrarre i campi
  lines.forEach((line) => {
    const correlationIdMatch = line.match(/"correlationId":\s*"([^"]+)"/);
    const styleCodeMatch = line.match(/"styleCode":\s*"([^"]+)"/);
    const errorCodeMatch = line.match(/"error code":\s*(\d+)/);
    const messageMatch = line.match(/"message":\s*"([^"]+)"/);
    const dateMatch = line.match(/"date":\s*"([^"]+)"/); // esempio di un nuovo campo

    // Crea un oggetto per i campi estratti e aggiungilo all'array
    extractedData.push({
      correlationId: correlationIdMatch ? correlationIdMatch[1] : "N/A",
      styleCode: styleCodeMatch ? styleCodeMatch[1] : "N/A",
      errorCode: errorCodeMatch ? errorCodeMatch[1] : "N/A",
      message: messageMatch ? messageMatch[1] : "N/A",
      date: dateMatch ? dateMatch[1] : "N/A",
    });
  });

  return extractedData;
}

// Funzione per generare l'Excel usando SheetJS
function generateExcelFile(data) {
  // Definisci le colonne dell'Excel
  const worksheetData = [
    ["Correlation ID", "Style Code", "Error Code", "Message", "Date"],
  ];

  // Aggiungi i dati estratti
  data.forEach((row) => {
    worksheetData.push([
      row.correlationId,
      row.styleCode,
      row.errorCode,
      row.message,
      row.date,
    ]);
  });

  // Crea un nuovo foglio di lavoro
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Crea una nuova cartella di lavoro (workbook)
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DLQ Data");

  // Genera il file Excel
  XLSX.writeFile(workbook, "DLQ_Data.xlsx");
}
