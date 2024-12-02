const axios = require("axios");
const fs = require("fs");

let options = []

const SPX_HOME = process.env.SPX_HOME
const DTE = process.env.DTE

const SCHWAB_DATA_V1_BASE = 'https://api.schwabapi.com/marketdata/v1'
const SCHWAB_TRADER_V1_BASE = 'https://api.schwabapi.com/trader/v1'

async function doPoll() {


  try {

    if (!SPX_HOME) {
      throw new Error(`doPoll: ERROR=empty SPX_HOME`)
    }

    if (!DTE) {
      throw new Error(`doPoll: ERROR=empty DTE`)
    }

    const date = getDate()
    if (!date) {
      throw new Error(`doPoll: ERROR=Can't get date`)
    }
    const accessToken = fs.readFileSync(SPX_HOME + '/.access', 'utf-8')

    const GET_OPTIONS = `chains?symbol=%24SPX&contractType=ALL&strikeCount=50&includeUnderlyingQuote=true&strategy=SINGLE&fromDate=${date}&toDate=${date}`
    const URL = `${SCHWAB_DATA_V1_BASE}/${GET_OPTIONS}`

    const res = await axios({
      method: 'GET',
      url: URL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    })

    if (Number(res.status) !== 200) {
      throw new Error(`doPoll: GET options chain failed, ERROR=Status ${res.status}`)
    }

    if (!res.data) {
      throw new Error(`doPoll: ERROR=Empty response body`)
    }

    const body = res.data
    // console.log(JSON.stringify(body, null, 2))

    if (!body.underlying) {
      throw new Error(`doPoll: ERROR=Empty underlying object`)
    }


    const spxInfo = {
      spxTime: body.underlying?.quoteTime,
      spxTimeFormatted: getTimeStringDash(new Date(body.underlying.quoteTime)),
      spxLast: body.underlying.last,
      spxSymbol: body.underlying.symbol
    }

    if (!spxInfo.spxTime || !spxInfo.spxTimeFormatted || !spxInfo.spxLast || !spxInfo.spxSymbol) {
      throw new Error(`doPoll: ERROR=Missing underlying object values`)
    }

    const data_fd = fs.openSync(`${SPX_HOME}/${date}/data/${spxInfo.spxTimeFormatted}.json`, 'w')
    try {
      const fileData = JSON.stringify(body, null, 2)
      fs.writeSync(data_fd, fileData)
    } catch (error) {
      console.error(`doPoll: Can't write to data file, ERROR=${JSON.stringify(error)}`)
    } finally {
      fs.closeSync(data_fd)
    }

    const dataNow_fd = fs.openSync(`${SPX_HOME}/${date}/data/now.json`, 'w')
    try {
      const fileData = JSON.stringify(body, null, 2)
      fs.writeSync(dataNow_fd, fileData)
    } catch (error) {
      console.error(`doPoll: Can't write to now file, ERROR=${JSON.stringify(error)}`)
    } finally {
      fs.closeSync(dataNow_fd)
    }

    const optionChainKey = `${date}:${DTE}`

    const putMap = body.putExpDateMap[optionChainKey]
    const callMap = body.callExpDateMap[optionChainKey]

    if (!putMap || !callMap) {
      throw new Error('doPoll: empty put or call map')
    }

    Object.keys(putMap).forEach(key => {
      const optFull = putMap[key][0]
      const optSummary = {
        symbol: optFull.symbol,
        fileName: optFull.symbol.substring(6),
        description: optFull.description,
        bid: Number(optFull.bid),
        ask: Number(optFull.ask),
        last: Number(optFull.last),
        delta: optFull.delta,
        theta: optFull.theta,
        strikePrice: Number(optFull.strikePrice),
        time: spxInfo.spxTime,
        timeFormatted: spxInfo.spxTimeFormatted,
        type: 'PUT'
      }
      options.push(optSummary)
    })

    Object.keys(callMap).forEach(key => {
      const optFull = callMap[key][0]
      const optSummary = {
        symbol: optFull.symbol,
        fileName: optFull.symbol.substring(6),
        description: optFull.description,
        bid: Number(optFull.bid),
        ask: Number(optFull.ask),
        last: Number(optFull.last),
        delta: optFull.delta,
        theta: optFull.theta,
        strikePrice: Number(optFull.strikePrice),
        time: spxInfo.spxTime,
        timeFormatted: spxInfo.spxTimeFormatted,
        type: 'CALL'
      }
      options.push(optSummary)
    })

    options.forEach((option) => {
      let entries
      let fileName = `${SPX_HOME}/${date}/options/${option.fileName}.json`
      try {
        const fileData = fs.readFileSync(fileName, 'utf8')
        entries = JSON.parse(fileData)
      } catch (err) {
        entries = []
      }

      let entry = {
        symbol: option.symbol,
        time: option.time,
        timeFormatted: option.timeFormatted,
        bid: option.bid,
        ask: option.ask,
        type: option.type
      }

      if (!entries.map((e) => e.time).includes(entry.time)) {
        entries.push(entry)
      }

      const entries_fd = fs.openSync(fileName, 'w')
      try {
        const fileData = JSON.stringify(entries, null, 2)
        fs.writeSync(entries_fd, fileData)
      } catch (error) {
        console.error(`doPoll: Can't write to entries file, ERROR=${JSON.stringify(error)}`)
      } finally {
        fs.closeSync(entries_fd)
      }

    })

    // console.log('PUTS')
    // console.log(JSON.stringify(puts, null, 2))
    // console.log('CALLS')
    // console.log(JSON.stringify(calls, null, 2))

  } catch (error) {
    console.error(`doPoll: ERROR=${JSON.stringify(error)}`)
  }
}

doPoll().catch(console.error)


function getTimeStringDash(date) {
  const p = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${p.hour}-${p.minute}-${p.second}`

}

function getDate() {

  try {
    let day
    const targetDate = fs.readFileSync(SPX_HOME + '/.date', 'utf-8')
    if (targetDate === 'today') {
      const dateObject = new Date();
      day = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`
    } else {
      day = targetDate
    }
    return day
  } catch (error) {
    console.error('getDate: ERROR ' + JSON.stringify(error))
  }
  return undefined
}




