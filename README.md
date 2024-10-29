# MEIC2 Project

This is a Node Javascript for Multiple Entry Iron Condor 0DTE options.


# How To

The main "recommendation" code is

omeic1.js

omeic is "Optimal <credit> MEIC"

After a node install and an "npm i" you would just have to run the following from a command line

node omeic.js

You would have to change the hardcoded path.
The file  '/Users/scottike/SPX/data/' + day + '/now.json' is just the output from a Schwab get option chain call

https://api.schwabapi.com/marketdata/v1/chains?symbol=%24SPX&contractType=ALL&strikeCount=50&includeUnderlyingQuote=true&strategy=SINGLE&fromDate=2024-10-29&toDate=2024-10-29&expMonth=OCT


