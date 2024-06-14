import pandas as pd
from bs4 import BeautifulSoup

def read_html_content(html_file_path):
    try:
        with open(html_file_path, 'r', encoding='utf-8') as file:
            website_content = file.read()
        return website_content
    except FileNotFoundError:
        print(f"File HTML non trovato: {html_file_path}")
        return None
    except Exception as e:
        print(f"Errore durante la lettura del file HTML: {e}")
        return None

def normalize_name(name):
    # Esempio di normalizzazione: converti tutto in minuscolo e rimuovi spazi bianchi
    return name.strip().lower()

def main():
    # Percorso del file HTML locale
    html_file_path = '/Users/kevin.malachin/Documents/TEST/LVMH_EAME_PROD.html'

    # Percorso del file Excel locale
    excel_file_path = '/Users/kevin.malachin/Documents/TEST/LVMH.xlsx'

    # Leggi il contenuto del file HTML
    website_content = read_html_content(html_file_path)
    if website_content is None:
        return

    # Crea l'oggetto BeautifulSoup
    soup = BeautifulSoup(website_content, 'html.parser')

    # Trova tutti i tag <a> con le classi specificate
    classToFind = soup.find_all('a', class_='sc-csuQGl fgtqry')

    # Estrai i testi di ogni tag trovato e normalizzali
    html_texts = {normalize_name(tag.get_text()) for tag in classToFind}

    # Gestione degli errori durante la lettura del file Excel
    try:
        df = pd.read_excel(excel_file_path, sheet_name='APIs Scope')
    except FileNotFoundError:
        print(f"File Excel non trovato: {excel_file_path}")
        return
    except Exception as e:
        print(f"Errore durante la lettura del file Excel: {e}")
        return

    # Chiedi all'utente di inserire il nome del progetto da cercare nella colonna "Project"
    project_name = input("Inserisci il nome del progetto (es. KAM): ").strip()

    # Filtra il DataFrame per il valore specificato nella colonna "Project"
    filtered_df = df[df['Project'] == project_name]

    # Estrai i nomi delle applicazioni (APIs Name) associate al progetto specificato e normalizzali
    project_apps = {normalize_name(name) for name in filtered_df['APIs Name'].str.strip()}

    # Trova i nomi delle applicazioni HTML che non sono presenti nel DataFrame filtrato
    html_not_in_excel = html_texts.difference(project_apps)

    # Stampa i nomi unici trovati
    if html_not_in_excel:
        print(f"Applicazioni mancanti per il progetto '{project_name}':")
        for name in html_not_in_excel:
            print(name)
    else:
        print(f"Nessuna applicazione mancante per il progetto '{project_name}'.")

if __name__ == "__main__":
    main()