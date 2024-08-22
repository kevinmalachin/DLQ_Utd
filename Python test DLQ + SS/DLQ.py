import re

def extract_filtered_references(text):
    # RegEx per ogni tipo di reference
    fr_pattern = r'\bFR\d{9}\b'
    zeco_pattern = r'\b1ZECO\d{6}\b'
    cm_pattern = r'\bCM_[\w-]+\b'
    ec_pattern_full = r'\bEC0\d{5}_[\w]+\b'
    ec_pattern_simple = r'\bEC0\d{5}\b(?!_)'  # EC0 seguito da numeri e NON seguito da "_"

    # Trova tutte le reference
    fr_matches = re.findall(fr_pattern, text)
    zeco_matches = re.findall(zeco_pattern, text)
    cm_matches = re.findall(cm_pattern, text)
    ec_matches_full = re.findall(ec_pattern_full, text)
    ec_matches_simple = re.findall(ec_pattern_simple, text)

    # Aggrega tutte le reference rimuovendo i duplicati
    all_references = list(set(fr_matches + zeco_matches + cm_matches +
                              ec_matches_full + ec_matches_simple))

    # Prepara l'output
    output_text = f"References found: {len(all_references)}\n"
    output_text += "\n".join(sorted(all_references)) + "\n\n"

    return output_text

if __name__ == "__main__":
    # Apri il file di input nella cartella specifica
    with open("Python test DLQ + SS/input.txt", "r") as file:
        text = file.read()

    result = extract_filtered_references(text)
    print(result)