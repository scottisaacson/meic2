# MEIC2 Project

This is a Node Javascript for 0DTE Multiple Entry Iron Condor 0DTE options.


# How To

WORKING SCHWAB TERMINAL

- run schwab-api-auth-automation/setup1.sh
  - cd schwab-api-auth-automation
  - ./setup1.sh
- run schwab-api-auth-automation/ikeauth1.sh
  - cd schwab-api-auth-automation
  - ./ikeauth1.sh
  - runs ikeauth1.js (reads from .env)
  - Copy URL, load URL in browser, login, accept, …, done
  - This captures and writes:
    - ACCESS_TOKEN to …/SPX/.access
    - REFRESH_TOKEN to …/SPX/.refresh
- run schwab-api-auth-automation/getAccountInfo1.sh
  - cd schwab-api-auth-automation
  - ./getAccountInfo1.sh
- run schwab-api-auth-automation/getAccountHash1.sh
  - cd schwab-api-auth-automation
  - ./getAccountHash1.sh
  - writes to …/SPX/.hashvalue
  
BOT SCHWAB TERMINAL

- run schwab-api-auth-automation/keepAlive1.sh
  - cd schwab-api-auth-automation
  - ./keepAlive1.sh
  - That runs ./ikerefresh1.sh every 10 mins
  - This captures and writes:
    - NEW_ACCESS_TOKEN to …/SPX/.access
    - NEW_REFRESH_TOKEN to …/SPX/.refresh

BOT MEIC TERMINAL

- run meic1/dailyData1.sh
  - cd meic1
  - ./dailyData.sh
  - that runs ./poll1.sh every 1 min
  - poll1 will only write files from 7:30am to 2:00pm
  - writes to data/<time>.json and data/now.json

BOT MEIC TERMINAL

- run meic1/tradeBot.sh
  - cd meic1
  - ./tradeBot1.sh
  - this runs ./recommend1.sh at  specified times (usually 12/day)
  - recomend1.sh
     - reads data/now.json 
     - if there is a recommendation, writes to 
       - recommendation-<time>.json
       - Otherwise it deletes omeic/recommendation.json
     - If there is a recommendation (omeic/recommendation.json)
       - reads omeic/recommendation.json
       - adds to positions/positions.json

WORKING MEIC TERMINAL

- run ./manualTrade1.sh
  - run immediately after recommend
  - finds the lasts entry in positions/positions.json
  - cd meic1
  - ./manualTrade1.sh
  - Enter the orders in TOS

- run meic1/monitor1.sh
  - cd meic1
  - ./monitor1.sh
    - writes to transactions/transactions.out
    - At any time before or after 2pm

- run meic1/exit1.sh
  - cd meic1
  - ./exit1.sh
  what it would cost to close every open position

Orders
  - ./getOrders.sh
  - ./getTransactions.sh
  - ./deleteOrder.sh
  - ./postOrder.sh





# OLD How To

The main "recommendation" code is

omeic1.js

omeic is "Optimal <credit> MEIC"

After a node install and an "npm i" you would just have to run the following from a command line

node omeic.js

You would have to change the hardcoded path.
The file  '/Users/scottike/SPX/data/' + day + '/now.json' is just the output from a Schwab get option chain call

https://api.schwabapi.com/marketdata/v1/chains?symbol=%24SPX&contractType=ALL&strikeCount=50&includeUnderlyingQuote=true&strategy=SINGLE&fromDate=2024-10-29&toDate=2024-10-29&expMonth=OCT


