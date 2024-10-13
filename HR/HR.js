document.getElementById("generateExcel").addEventListener("click", function () {
  const dlqText = document.getElementById("dlqInput").value;

  if (!dlqText) {
    alert("Please paste DLQ content.");
    return;
  }

  // Estrai il nome della DLQ dal testo incollato
  const dlqQueueName = extractDLQName(dlqText);

  // Estrai i campi necessari
  const extractedData = extractDLQFieldsWithRegex(dlqText);

  // Rimuovi eventuali duplicati basati solo sul processId
  const uniqueData = removeDuplicateEntriesByProcessId(extractedData);

  // Genera e scarica l'Excel
  generateExcelFile(uniqueData, dlqQueueName);
});

function extractDLQName(dlqText) {
  const dlqMatch = dlqText.match(/(prod\.[a-zA-Z0-9._-]+\.DLQ)/);
  return dlqMatch ? dlqMatch[1] : "DLQ_File";
}

// Funzione per estrarre i campi usando regex
function extractDLQFieldsWithRegex(dlqText) {
  // Suddivide il testo in base ai processId
  const messageBlocks = dlqText.split(/(?="processId":)/g);
  let extractedData = [];

  messageBlocks.forEach((block) => {
    const eventIdMatch = block.match(/"processId":\s*"([a-f0-9-]{36})"/);
    const errorTypeMatch = block.match(/"errorType":\s*"([^\"]+)"/);
    const errorMessageMatch = block.match(/"message":\s*"([^"]+)"/);
    const errorCodeMatch = block.match(/"code":\s*"(\d+)"/);
    const muleEncodingMatch = block.match(/"MULE_ENCODING":\s*"([^\"]+)"/);

    if (eventIdMatch || errorTypeMatch || errorMessageMatch || errorCodeMatch || muleEncodingMatch) {
      extractedData.push({
        eventId: eventIdMatch ? eventIdMatch[1].trim() : "N/A",
        errorType: errorTypeMatch ? errorTypeMatch[1].trim() : "N/A",
        errorMessage: errorMessageMatch ? errorMessageMatch[1].trim() : "N/A",
        errorCode: errorCodeMatch ? errorCodeMatch[1].trim() : "N/A",
        muleEncoding: muleEncodingMatch ? muleEncodingMatch[1].trim() : "N/A",
      });
    }
  });

  return extractedData;
}

// Funzione per rimuovere i duplicati basati solo su processId
function removeDuplicateEntriesByProcessId(data) {
  const uniqueData = [];
  const seenProcessIds = new Set();

  data.forEach((entry) => {
    if (!seenProcessIds.has(entry.eventId)) {
      uniqueData.push(entry);
      seenProcessIds.add(entry.eventId);
    }
  });

  return uniqueData;
}

// Funzione per generare l'Excel usando SheetJS
function generateExcelFile(data, dlqQueueName) {
  const worksheetData = [
    ["Event ID", "Error Type", "Error Message", "Error Code", "Mule Encoding"],
  ];

  data.forEach((row) => {
    worksheetData.push([
      row.eventId,
      row.errorType,
      row.errorMessage,
      row.errorCode,
      row.muleEncoding,
    ]);
  });

  // Crea un nuovo foglio di lavoro
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-resize delle colonne in base al contenuto
  const maxLengths = worksheetData[0].map((_, colIndex) =>
    Math.max(
      ...worksheetData.map((row) => row[colIndex].toString().length),
      10 // Minimo larghezza
    )
  );

  worksheet["!cols"] = maxLengths.map((length) => ({ wch: length }));

  // Crea una nuova cartella di lavoro (workbook)
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "DLQ Data");

  // Genera il file Excel con il nome della DLQ
  XLSX.writeFile(workbook, `${dlqQueueName}.xlsx`);
}