import re

def extract_references(text):
    # Regex per trovare tutte le reference che seguono vari formati, inclusi formati più flessibili
    patterns = [
        r'"internalReference":\s*"([^"]+)"',
        r'"entityRef":\s*"([^"]+)"',
        r'"rootEntityRef":\s*"([^"]+)"',
        r'"ref":\s*"([^"]+)"',
        r'"asnId":\s*"([^"]+)"',
        r'"reference_":\s*"([^"]+)"',   # Nuovo pattern aggiunto per reference incomplete
        r'"CM_reference_":\s*"([^"]+)"'  # Altro pattern per CM reference
    ]

    # Estrarre tutte le reference combinate
    combined_references = []
    for pattern in patterns:
        matches = re.findall(pattern, text)
        combined_references += matches

    # Debug: mostra tutte le reference trovate prima di filtrare
    print(f"Tutte le reference trovate: {combined_references}")

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

    # Deduplicazione meno aggressiva
    unique_references = list(set(further_filtered_references))

    # Verifica se ci sono reference nella forma CM_ e filtra se necessario
    final_references = unique_references
    has_cm_references = any(ref.startswith("CM_") for ref in final_references)
    if has_cm_references:
        final_references = [ref for ref in final_references if ref.startswith("CM_")]

    # Contatore delle occorrenze delle reference
    reference_counts = {}
    for ref in further_filtered_references:
        reference_counts[ref] = reference_counts.get(ref, 0) + 1

    # Creazione del testo per l'output dei risultati con una reference per riga
    output_text = f"References found: {len(final_references)}\n"
    output_text += "\n".join(final_references) + "\n\n"
    output_text += "Duplicate counts:\n"
    for ref, count in reference_counts.items():
        if count > 1:
            output_text += f"{ref}: {count}\n"

    return output_text

if __name__ == "__main__":
    # Inserisci qui il testo da analizzare
    with open("input.txt", "r") as file:
        text = file.read()

    result = extract_references(text)
    print(result)