# Study Addiction (by Study addicts - Alex Wong and Jin Chul Ann, 2015)

## Brief Overview

This is a web application that uses sockets to book tables in a library real-time. It also uses database to authorize user logins. 

## How to Run

1. In terminal, navigate to folder and run 'node server.js'
2. (Optional) To broadcast to world wide web, open another terminal, navigate to same folder, and run './ngrok http 3000'

This emits the local server onto the web via a temporary URL.

After you do this step, you can use the temporary URL shown on the terminal to go on the page. At the same time, other users can use this URL to log in and will be sharing the same database. If you do not do this step, then you will have to implement some sort of web-hosting application, or else, the server will only run on localhost:3000.

3. If you didn't do step 2, go to localhost:3000. If you did, go to http://<temporary URL from step 2>.ngrok.io shown on terminal.

4. Sign In / Sign Up

5. After you sign in, click on “To Map”.

*note that ngrok is a 3rd party software, and I did not program or contribute to this.
