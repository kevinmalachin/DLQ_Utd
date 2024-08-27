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
            let incidentGroups = {};
            output.forEach(item => {
                const incident = item.incident || "NOT REPORTED";
                if (!incidentGroups[incident]) {
                    incidentGroups[incident] = [];
                }
                incidentGroups[incident].push(item.reference);
            });

            // Genera l'output finale
            let outputText = "Reference riportate:\n";
            for (const [incident, refs] of Object.entries(incidentGroups)) {
                outputText += `- ${incident}\n`;
                refs.forEach(ref => outputText += `  - ${ref}\n`);
            }

            // Mostra l'output
            results.textContent = outputText;
        } catch (error) {
            console.error('Errore durante la chiamata al server:', error);
            results.textContent = "Errore durante la chiamata al server.";
        }
    });
}