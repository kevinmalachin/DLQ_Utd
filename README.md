# DLQ_United

There are two script, on in JavaScript and one in Python

The one in JS will extract the ref from the content of the DLQ copied
The one in python runs a server in a local environment (for this reason you need to set up your credentials for JIRA in the local environment with your email and the
public token freely provided by Jira) and make a GET call to the global API of JIRA searching some specific values for some keys (our projects and tasks).

Here's how it work:

- Insert ALL the content of the payload in the first textarea;
- The output will follow the pattern if a reference is in the format CM_EC0XXXXX_XXX will not report the one EC0XXXXX;
- If a duplicated is found will be reported in the format (x1, x2 etc.,)
- If a reference has EC0XXXXX_only letters will not be reported;
- If a reference has EC0XXXXX-letters+number will be reported;
- Reference ending with "-STD" will be not reported (since are usually duplicated and because we already have the one in the EC0XXXXX format);
- IMPORTANT: At the current stage, for the Ordercreation.DLQ given the format of the payload we'll receive a (x2) for every ref, you have to consider the final number divided by 2;
- After that a GET call to Jira will be made and the reference found in the first textarea will be searched in the JSON Body in response from the Jira API;
- If a reference is NOT reported will be grouped with all the reference NOT reported in the RED color;
- If it was already reported will be grouped in the GREEN reference and the task number and link will be indicated - reference in the same task will be grouped together by tasks;
- the script searches the values in the JSON payload in response at the call made to the JIRA API for "key, summary, customfield_10111, description" and also the link; if the reference is found in the description it will be reported in the GREEN section and the link will be provided;
- If you want you can also create a template ticket clicking the "Create Ticket" button = two Boxes will appear at the bottom with short description and description.
  The short description will be populated with our short description template and a variable calling the actual DLQ you are checking (the variable is the same) and the short description will automatically
  populated our template for the DLQ tickets and add the name of the DLQ and the "REF to be reported". The "REF to be reported" will be only the one checked as "NOT reported" int he previous button.
  For this reason if you don't have any ref not reported in the previous button you will not have the ticket created after clicking the "Create Ticket" button. It will only work if you have at least one
  reference not reported in the previous button.

  So it is important that the Jira task are updated with the references in the descriptions;

Since is doing a lot of stuff give it some seconds :P

to start Flask server:
python3 App.py <!-- Or python FlaskApp depending on the version -->
or start directly from vs code
if it's working you should see something like:

- Serving Flask app 'FlaskApp'
- Debug mode: on
  WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
- Running on http://127.0.0.1:5000
  Press CTRL+C to quit
- Restarting with stat
- Debugger is active!
- Debugger PIN: 401-409-058

---

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

# Creare un nuovo ambiente virtuale / create virtual environment

python3 -m venv venv

# Attivare l'ambiente virtuale / Activate the virtual environment

source venv/bin/activate # on macOS/Linux

.\venv\Scripts\activate # On Windows

# Installare Flask e Flask-CORS all'interno dell'ambiente virtuale / to install Flask e Flask-CORS in the virtual environment

pip install flask flask-cors

---

Support scope check NOT COMPLETE

There are two script, on in JavaScript and one in Python

JavaScript:

- Select the customer, select the business group (if there are no business group it's ok you can skip and the script will check all the cells in the excel)
- Attach the html file (need the OuterHTML because otherwise some apps will miss)
  - Attach the excel

There will be the output in the textarea below

Python: - Click on the menù, the script will run but before you need to run python3 FlaskApp.py to start the server <!-- Or python FlaskApp depending on the version --> - There will be an output in excel in a specific folder with the column of the app checked and the difference between excel and HTML

IMPORTANT:
for python you need to modifiy the script with the path of your html and excel files.

STILL UNDER TESTING

---
