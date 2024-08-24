import re

def extract_filtered_references(text):
    # Regex per trovare tutte le reference che seguono vari formati
    patterns = [
        r'"internalReference":\s*"([^"]+)"',
        r'"entityRef":\s*"([^"]+)"',
        r'"rootEntityRef":\s*"([^"]+)"',
        r'"ref":\s*"([^"]+)"',
        r'"asnType":\s*"(\w+)"\s*,\s*"asnId":\s*"([^"]+)"'  # Pattern per asnType e asnId insieme
    ]

    # Combina tutte le reference trovate
    combined_references = []
    for pattern in patterns:
        matches = re.findall(pattern, text)
        if pattern == patterns[-1]:  # Se è il pattern per asnType e asnId
            # Aggiunge asnId con asnType formattato tra parentesi quadre
            combined_references.extend([f"{asn_id} [{asn_type}]" for asn_type, asn_id in matches])
        else:
            combined_references.extend(matches)

    # Filtra le reference per escludere quelle nel formato UUID
    filtered_references = [
        ref for ref in combined_references
        if not re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', ref)
    ]

    # Filtra le reference per escludere quelle che hanno la forma EC0XXXXX-STD (solo lettere dopo il trattino)
    further_filtered_references = [
        ref for ref in filtered_references
        if not re.match(r'^EC0\d{5}-[A-Z]+$', ref)
    ]

    # Contatore delle occorrenze delle reference
    reference_counts = {}
    for ref in further_filtered_references:
        reference_counts[ref] = reference_counts.get(ref, 0) + 1

    # Deduplicazione: Rimuove i duplicati mantenendo la versione più completa
    unique_references = {}
    for ref in further_filtered_references:
        base_ref = ref.split("-")[0]
        if not unique_references.get(base_ref) or len(ref) > len(unique_references[base_ref]):
            unique_references[base_ref] = ref

    # Filtraggio per reference CM_
    final_references = list(unique_references.values())
    cm_references = [ref for ref in final_references if ref.startswith("CM_")]
    if cm_references:
        # Se ci sono reference che iniziano con CM_, si tengono solo quelle
        final_references = cm_references

    # Rimozione delle reference con formato "INVOICE-UUID"
    final_references = [
        ref for ref in final_references
        if not re.match(r'^INVOICE-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', ref)
    ]

    # Creazione del testo per l'output dei risultati con una reference per riga
    output_text = f"References found: {len(final_references)}\n"
    output_text += "\n".join(sorted(final_references)) + "\n\n"
    output_text += "Duplicate counts:\n"
    for ref, count in reference_counts.items():
        if count > 1 and ref in final_references:  # Conteggio solo delle reference finali
            output_text += f"{ref}: {count}\n"

    return output_text

if __name__ == "__main__":
    # Apri il file di input nella cartella specifica
    with open("Python test DLQ + SS/input.txt", "r") as file:
        text = file.read()

    result = extract_filtered_references(text)
    print(result)
