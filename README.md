# MEIC2 Project

This is a Node Javascript project for 0DTE Multiple Entry Iron Condor options.


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
  - ./keepAlive.sh
  - That runs ./ikerefresh1.sh every 10 mins
  - This captures and writes:
    - NEW_ACCESS_TOKEN to …/SPX/.access
    - NEW_REFRESH_TOKEN to …/SPX/.refresh

BOT MEIC TERMINAL

- run meic2/dailyData.sh
  - cd meic2
  - ./dailyData.sh
  - that runs ./poll.sh every 1 min
  - poll will only write files from 7:30am to 2:00pm
  - writes to data/<time>.json and data/now.json
  - writes to options/<option>.json
    - these are the price entries for a given option for the day

BOT MEIC TERMINAL

- run meic2/tradeBot.sh
  - cd meic2
  - ./tradeBot.sh
  - this runs ./recommend.sh at specified times (usually 6/day)
  - recommend.sh
     - reads data/now.json
     - if it finds a recommendation
       - writes to omeic/recommendation-<time>.json
       - writes to omeic/recommendation.json
     - Otherwise it deletes omeic/recommendation.json
     - If there is a recommendation (omeic/recommendation.json)
       - reads omeic/recommendation.json
       - adds to positions/positions.json
       - this is for paper trading
  - tradeBot can be edited to run
    - ./placeTOSOrders.sh
    - this will do the following
      - poll
      - recommend
      - createTOSOrder
      - postTOSPutSpread
      - postTOSCallSpread

WORKING MEIC TERMINAL

- run ./manualTrade.sh
  - This can be used instead of placeTOSOrders.sh
  - run immediately after recommend
  - finds the lasts entry in positions/positions.json so you know what order to place using TOS
  - cd meic2
  - ./manualTrade.sh
  - Enter the orders in TOS

- run meic2/monitor.sh (paper trading)
  - cd meic2
  - ./monitor.sh
    - writes to transactions/transactions.out
    - At any time before or after 2pm
  - This tells you if something has been stopped out

- run meic2/exit.sh
  - cd meic2
  - ./exit2.sh
  - this tells you what it would cost to close every open position

- run meic2/track.sh
  - cd meic2
  - ./track.sh
  - this tells how close you are being to being STOPPED OUT

- run meic2/dumpTableau.sh
  - cd meic2
  - ./dumpTableau.sh
  - this shows the current table of puts and calls

- run meic2/postTOS<type>SpreadPreview.sh
  - this shows a preview of the ostTOS<type>Spread place order calls
  
**Orders
  - ./getOrders.sh
  - ./getTransactions.sh
  - ./deleteOrder.sh
  - ./postOrder.sh

# ENV
You need to set up the env variables
- SPX_HOME
- DTE
- PROJECTS
- Can use myEnv.sh 
  - . ./myEnv.sh
- This is a work in progress
  - Not all files have been updated to use this


# OLD How To

The main "recommendation" code is

omeic1.js

omeic is "Optimal <credit> MEIC"

After a node install and an "npm i" you would just have to run the following from a command line

node omeic.js

You would have to change the hardcoded path.
The file  '/Users/scottike/SPX/data/' + day + '/now.json' is just the output from a Schwab get option chain call

https://api.schwabapi.com/marketdata/v1/chains?symbol=%24SPX&contractType=ALL&strikeCount=50&includeUnderlyingQuote=true&strategy=SINGLE&fromDate=2024-10-29&toDate=2024-10-29&expMonth=OCT


