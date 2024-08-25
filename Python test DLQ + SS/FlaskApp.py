from flask import Flask, render_template, send_from_directory, request, jsonify
import subprocess

app = Flask(__name__, static_folder='.', template_folder='.')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/SupportScope')
def support_scope():
    return render_template('SupportScope.html')

@app.route('/run-script', methods=['POST'])
def run_script():
    try:
        # Esegui il tuo script Python
        result = subprocess.run(['python', 'path/to/your_script.py'], capture_output=True, text=True)
        return jsonify({"output": result.stdout})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
