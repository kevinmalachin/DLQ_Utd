# DLQ_United

There are two script, on in JavaScript and one in Python

The one in JS will extract the ref from the content of the DLQ copied
The one in python runs a server in a local environment (for this reason you need to set up your credentials for JIRA in the local environment with your email and the
public token provided freely by Jira) and make a GET call to the global API of JIRA searching some specific values for some keys

Here's how it work:

- Insert ALL the content of the payload in the first textarea
- The ouput will follow the pattern if a reference is in the format CM_EC0XXXXX_XXX will not report the one EC0XXXXX.
- If a duplicated is found will be reported
- If a reference has EC0XXXXX_only letters will not be reported
- If a reference has EC0XXXXX-letters+number will be reported
- After that a GET call to Jira will be made and the reference foun in the first textarea will be searched in the JSON Body in response from the Jira API
- If a reference is not reported will be grouped with all the reference not reported
- If it was already reported will be grouped by task number - reference in the same task will appear under the same task
- the script search for the values in the JSON for "key,summary,customfield_10111,description" (some will be added, and also the link)


Since is doing a lot of stuff give it some seconds :P

to start Flask server:
python3 App.py                     <!-- Or python FlaskApp depending on the version -->
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

macOs

brew install python

- For Windows, download and install Python from python.org

# Verify pip installation

pip --version

If installed


pip install beautifulsoup4
pip install requests
pip install flask
pip install flask-cors

# Creare un nuovo ambiente virtuale
python3 -m venv venv

# Attivare l'ambiente virtuale
source venv/bin/activate  # On macOS/Linux
.\venv\Scripts\activate      # On Windows

# Installare Flask e Flask-CORS all'interno dell'ambiente virtuale
pip install flask flask-cors
______________________________________________________________________________________________________________________________________________________________________

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

STILL UNDER TESTING
________________________________________________________________________________________________________________________________________________


