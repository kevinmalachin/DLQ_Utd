# DLQ_United

Insert ALL the content of the payload in the first textarea
Insert all incidents reported in tickets in the second textarea with JUST A SPACE between the references
check the results in the third textarea

---

Support scope check

ctrl+a to take all the runtime manager content
copy in the first textarea
take the column from the Support scope with all the application and paste in the second textarea
click "check" -> the button has a function to check with a RegExp if an application is found in the first TextArea (Runtime) but NOT in the second one will appear in the third one.
So in the third text area will appear those apps that are in the runtime (1) but not in the support (2).
To avoid the dates (format YYYY-MM-DD) to appear in the third one the RegExp has a special filter that excludes the date format.

STILL TESTING
because for LVMH and Bouygues is working fine but not for other customers with different naming convention for the application.