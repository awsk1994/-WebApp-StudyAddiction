# Study Addiction 

By Study Addicts (Alex Wong and Jin Chul Ann, 2015)

## Brief Overview

This is a web application that uses sockets to book tables in a library real-time. Additionally, it uses:

- SQLite as Database to authorize user logins.

- Leaflet to implement the map.

- NodeJS & Express to host server.

## How to Run

1. In terminal, navigate to folder and run 'node server.js'
2. (Optional) To broadcast to world wide web, open another terminal, navigate to same folder, and run './ngrok http 3000'

This emits the local server onto the web via a temporary URL.

After you do this step, you can use the temporary URL shown on the terminal to go on the page. At the same time, other users can use this URL to log in and will be sharing the same database. If you do not do this step, then you will have to implement some sort of web-hosting application, or else, the server will only run on localhost:3000.

3. If you didn't do step 2, go to localhost:3000. If you did, go to http://<temporary URL from step 2>.ngrok.io shown on terminal.

4. Sign In / Sign Up

5. After you sign in, click on “To Map”.

*note that ngrok is a 3rd party software, and I did not program or contribute to this.

## Components 

map.html: 

The main part of this application: map interface to allow user to click on table to toggle the availability on/off, and view printer queue as well.

tableControl.html: another interface to control the availability of tables by inserting the table id.

printerControl.html: another interface to increment/decrement printer by printer id Format: 
+<printer_id> {increment printer queue}  or  -<printer_id> {decrement printer queue}

OTHER FILES:

printer.json: json information regarding to printers (e.g.: coordinate)

data.json: json information regarding to tables (eg: coordinates)

database.sqlite: SQLite file storing all user info(username, password, email.etc)

server.js: Javascript for server.

ngrok: app to put local server onto www.

node_modules: all the 3rd party plugins

static_files:

border_data.js: javascript that stores information about carlson library’s floor layout

leaflet.css: leaflet plugin 

jquery-1.11.3.min.js: jquery

signedin.html: signed in page

signin.html: sign in page

signup.html: sign up page

editinfo.html: edit information page (needs to sign in first)

deleted.html: deleted user page (when user clicks delete button after signing in)

FUTURE IMPLEMENTATION of this applications can expand to: 

(a) other libraries

(b) usage with a system to control printer queue (e.g: when a student prints something, it increments the printer queue, and decrements 
after student is completed)

(c) include user information when updating a table

(d) enable tables to move around, which will be controlled by an administrator (such as a librarian)

(e) queue-related events (such as the line in a cafeteria, or how many people have entered a buffet).
