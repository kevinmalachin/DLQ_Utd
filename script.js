"use strict";

const DLQtext = document.querySelector(".DLQtext");
const results = document.querySelector(".Results");
const check = document.querySelector(".Check");

// Verifica che gli elementi siano trovati
if (!DLQtext || !results || !check) {
    console.error("Elementi non trovati nella pagina.");
} else {
    check.addEventListener("click", async (e) => {
        e.preventDefault();

        // Prendi il valore dalla textarea
        const dlqText = DLQtext.value;

        // Regex per trovare tutte le reference
        const patterns = [
            /"internalReference":\s*"([^"]+)"/g,
            /"entityRef":\s*"([^"]+)"/g,
            /"rootEntityRef":\s*"([^"]+)"/g,
            /"ref":\s*"([^"]+)"/g,
            /"asnId":\s*"([^"]+)"/g
        ];

        // Combina tutte le reference trovate
        let combinedReferences = [];
        patterns.forEach(pattern => {
            const matches = [...dlqText.matchAll(pattern)];
            combinedReferences.push(...matches.map(match => match[1]));
        });

        // Filtra le reference
        const filteredReferences = combinedReferences.filter(ref => 
            !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(ref) &&
            !/^EC0\d{5}-[A-Z]+$/.test(ref)
        );

        const uniqueReferences = {};
        filteredReferences.forEach((ref) => {
            const baseRef = ref.split("-")[0];
            if (!uniqueReferences[baseRef] || ref.length > uniqueReferences[baseRef].length) {
                uniqueReferences[baseRef] = ref;
            }
        });

        const uniqueReferenceValues = Object.values(uniqueReferences);

        // Fai la chiamata al server per lo scraping
        try {
            const response = await fetch('http://localhost:5000/run-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ references: uniqueReferenceValues }),
            });

            const data = await response.json();
            const { output } = data;

            // Organizza le reference per incident
            let nonReportedText = "Reference non riportate:\n";
            output.non_reported.forEach(ref => {
                nonReportedText += `- ${ref}\n`;
            });

            let reportedText = "\nReference riportate:\n";
            for (const [incident, refs] of Object.entries(output.reported)) {
                reportedText += `**${incident}**\n`;
                refs.forEach(ref => {
                    reportedText += `  - ${ref.reference} | ${ref.task_name} | ${ref.task_link}\n`;
                });
            }

            // Mostra l'output
            results.textContent = nonReportedText + reportedText;
        } catch (error) {
            console.error('Errore durante la chiamata al server:', error);
            results.textContent = "Errore durante la chiamata al server.";
        }
    });
}