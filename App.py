from flask import Flask, jsonify, request
from bs4 import BeautifulSoup
import os

app = Flask(__name__)

@app.route('/scrape', methods=['GET'])
def scrape():
    file_path = '/Users/kevin.malachin/Documents/SupportScopeSheets&HTML/Dior.html'
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            website_content = file.read()
        
        soup = BeautifulSoup(website_content, 'html.parser')
        classToFind = soup.find_all('a', class_='sc-csuQGl fgtqry')
        
        results = [tag.get_text() for tag in classToFind]
        
        return jsonify(results)
    except FileNotFoundError:
        return jsonify({"error": f"File not found: {file_path}"}), 404

if __name__ == '__main__':
    app.run(debug=True)
