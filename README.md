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
