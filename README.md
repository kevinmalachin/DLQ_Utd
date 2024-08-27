# DLQ_United

- Insert ALL the content of the payload in the first textarea
- The ouput will follow the pattern if a reference is in the format CM_EC0XXXXX_XXX will not report the one EC0XXXXX.
- If a duplicated is found will be reported
- If a reference has EC0XXXXX_only letters will not be reported
- If a reference has EC0XXXXX-letters+number will be reported

---

Support scope check

There are two script, on in JavaScript and one in Python

JavaScript:
 - Select the customer, select the business group (if there are no business group it's ok you can skip and the script will check all the cells in the excel)
  - Attach the html file (need the OuterHTML because otherwise some apps will miss)
    - Attach the excel

There will be the output in the textarea below

Python:
    - Click on the menù, the script will run but before you need to run python3 FlaskApp.py to start the server            <!-- Or python FlaskApp depending on the version -->
        - There will be an output in excel in a specific folder with the column of the app checked and the difference between excel and HTML

IMPORTANT:
for python you need to modifiy the script with the path of your html and excel files.
________________________________________________________________________________________________________________________________________________


to start Flask server:
python3 FlaskApp.py                     <!-- Or python FlaskApp depending on the version -->
or start directly from vs code
if it's working should be

 * Serving Flask app 'FlaskApp'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: 401-409-058

___________________________________________________________________________________________________________________

# to install libraries and dependencies

brew install python

pip --version

pip install beautifulsoup4
pip install requests
pip install flask
pip install flask-cors

# to create an environment

# Creare un nuovo ambiente virtuale
python3 -m venv venv

# Attivare l'ambiente virtuale
source venv/bin/activate  # Su macOS/Linux

# Installare Flask e Flask-CORS all'interno dell'ambiente virtuale
pip install flask flask-cors



