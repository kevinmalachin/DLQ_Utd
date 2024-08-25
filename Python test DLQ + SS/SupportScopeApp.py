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

def extract_applications_from_html(html_content, class_name):
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        applications = set()
        elements = soup.find_all(class_=class_name)

        for element in elements:
            app_name = element.text.strip().lower()
            applications.add(app_name)

        print("Applicazioni estratte dall'HTML:")
        for app in applications:
            print(app)

        return applications if applications else set()

    except Exception as e:
        print(f"Errore durante l'estrazione delle applicazioni dall'HTML: {e}")
        return set()

def read_excel_file(file_path):
    try:
        engines = ['openpyxl', 'xlrd', 'odf', 'pyxlsb']
        for engine in engines:
            try:
                return pd.read_excel(file_path, sheet_name='APIs Scope', engine=engine)
            except Exception as e:
                print(f"Errore con il motore {engine}: {e}")
        return None
    except Exception as e:
        print(f"Errore durante la lettura del file Excel: {e}")
        return None

def search_keyword_in_excel(df, keyword):
    try:
        keyword = keyword.lower()
        filtered_rows = df.apply(lambda row: row.astype(str).str.lower().str.contains(keyword).any(), axis=1)
        matching_rows = df[filtered_rows]

        if matching_rows.empty:
            print(f"Keyword '{keyword}' non trovato in nessuna riga.")
            return set()

        # Prendi i valori dalla colonna 'APIs Name'
        api_names = matching_rows['APIs Name'].dropna().str.strip().str.lower()
        return set(api_names)
    except Exception as e:
        print(f"Errore durante la ricerca della parola chiave nei dati Excel: {e}")
        return set()

def normalize_string(s):
    return s.strip().lower()

def find_discrepancies(excel_apps, html_apps):
    try:
        print("Applicazioni normalizzate dall'Excel:")
        for app in excel_apps:
            print(normalize_string(app))

        print("\nApplicazioni normalizzate dall'HTML:")
        for app in html_apps:
            print(normalize_string(app))

        normalized_excel_apps = {normalize_string(app) for app in excel_apps}
        normalized_html_apps = {normalize_string(app) for app in html_apps}

        html_only = normalized_html_apps - normalized_excel_apps
        excel_only = normalized_excel_apps - normalized_html_apps

        return html_only, excel_only
    except Exception as e:
        print(f"Errore durante la ricerca delle discrepanze: {e}")
        return set(), set()

def generate_report(output_file_path, keyword, excel_apps, html_only, excel_only):
    try:
        with open(output_file_path, 'w', encoding='utf-8') as file:
            file.write(f"Rapporto di controllo per il keyword '{keyword if keyword else 'Non specificato'}'\n\n")
            file.write("Nomi delle applicazioni:\n")
            for name in sorted(excel_apps):
                file.write(f"{name}\n")

            file.write("\nDiscrepanze tra HTML ed Excel:\n")
            file.write("Applicazioni trovate solo nell'HTML (Runtime):\n")
            for name in sorted(html_only):
                file.write(f"{name}\n")

            file.write("\nApplicazioni trovate solo nell'Excel:\n")
            for name in sorted(excel_only):
                file.write(f"{name}\n")

        print(f"Rapporto generato con successo: {output_file_path}")

    except Exception as e:
        print(f"Errore durante la generazione del rapporto: {e}")

def main():
    try:
        html_file_path = r'C:\Users\kevin\Documents\Automatizzazioni\LVMH_EAME_PROD.html'
        excel_file_path = r'C:\Users\kevin\Documents\Automatizzazioni\LVMH.xlsx'
        output_file_path = r'C:\Users\kevin\Desktop\OutputScope\SupportScopeReport.txt'
        class_name = 'sc-csuQGl fgtqry'  # Classe HTML corretta per i nomi delle applicazioni

        keyword = input("Inserisci il keyword per il filtro (es. KAM) o premi invio per saltare il filtro: ").strip()

        website_content = read_html_content(html_file_path)
        if website_content is None:
            return

        df = read_excel_file(excel_file_path)
        if df is None:
            print(f"Errore durante la lettura del file Excel: {excel_file_path}")
            return

        excel_apps = search_keyword_in_excel(df, keyword)
        if not excel_apps:
            print(f"Errore durante la ricerca del file Excel per il keyword {keyword}")
            return

        html_apps = extract_applications_from_html(website_content, class_name)
        if not html_apps:
            print("Applicazioni non trovate nell'HTML. Impossibile procedere con il confronto.")
            return

        html_only, excel_only = find_discrepancies(excel_apps, html_apps)

        generate_report(output_file_path, keyword, excel_apps, html_only, excel_only)

    except Exception as e:
        print(f"Errore durante l'esecuzione del programma: {e}")

if __name__ == "__main__":
    main()
