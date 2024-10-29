// Import the 'fs' module to interact with the file system
const fs = require('fs')

const day = '2024-10-23'
const fileName = '/Users/scottike/Downloads/' + day + '.json'
const optionChainKey = day + ':0'

const minCloseToATM = 10
let maxCloseToATM

const maxSpread = 50
let minSpread

const minNetCredit = 1.00
const maxNetCredit = 2.60

const minLong = 0.10
const maxLong = 1.00


let rawData
let puts = []
let calls = []

let spxLast
let spxSymbol
let spxTime

let putShort
let putLong
let callShort
let callLong



// Read the JSON file asynchronously
fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading the file:", err)
        return
    }

    // Parse the JSON data
    rawData = JSON.parse(data)

    prepData()

    processData()

    printData()


})

function prepData() {

    // find the tableau

    spxSymbol = rawData.underlying.symbol
    spxLast = rawData.underlying.last
    spxTime = rawData.underlying.quoteTime

    const putMap = rawData.putExpDateMap[optionChainKey]
    const callMap = rawData.callExpDateMap[optionChainKey]

    Object.keys(putMap).forEach(key => {
        const optFull = putMap[key][0]
        const optSummary = {
            symbol: optFull.symbol,
            description: optFull.description,
            bid: Number(optFull.bid),
            ask: Number(optFull.ask),
            last: Number(optFull.last),
            delta: optFull.delta,
            theta: optFull.theta,
            strikePrice: Number(optFull.strikePrice)
        }
        if (optSummary.strikePrice < spxLast && optSummary.ask >= minLong) {
            puts.push(optSummary)
        }
    })

    puts.sort((a, b) => Number(a.strikePrice) - Number(b.strikePrice))


    Object.keys(callMap).forEach(key => {
        const optFull = callMap[key][0]
        const optSummary = {
            symbol: optFull.symbol,
            description: optFull.description,
            bid: Number(optFull.bid),
            ask: Number(optFull.ask),
            last: Number(optFull.last),
            delta: optFull.delta,
            theta: optFull.theta,
            strikePrice: Number(optFull.strikePrice)
        }
        if (optSummary.strikePrice > spxLast && optSummary.ask >= minLong) {
            calls.push(optSummary)
        }
    })

    calls.sort((a, b) => Number(b.strikePrice) - Number(a.strikePrice))


}

function processData() {

    let possibleLong = minLong
    while (callShort == undefined && possibleLong <= maxLong) {
        callLong = findLong(calls, possibleLong)
        callShort = findShort(calls, callLong, spxLast, 'CALL')
        if (callShort == undefined) {
            possibleLong = possibleLong + 0.05
        }
    }

    possibleLong = minLong
    while (putShort == undefined && possibleLong <= maxLong) {
        putLong = findLong(puts, possibleLong)
        putShort = findShort(puts, putLong, spxLast, 'PUT')
        if (putShort == undefined) {
            possibleLong = possibleLong + 0.05
        }
    }


}


function printData() {

    console.log('')
    console.log(`Symbol: ${spxSymbol}`)
    console.log(`Last: ${spxLast}`)
    const localTime = convertEpochToLocalTime(spxTime);
    console.log(`time: ${localTime}`)

    console.log('')
    console.log(`===== PUTS ================================================================`)
    let closeToATM = false
    puts.forEach(put => {
        if ((spxLast - put.strikePrice) < minCloseToATM) {
            if (closeToATM == false) {
                console.log('---------------------------------------------------------------------------')
            }
            closeToATM = true
        }
        let adorn = ''
        if (putShort) {
            if (putShort.strikePrice == put.strikePrice) {
                adorn = '<SRT'
            }
            if (putLong.strikePrice == put.strikePrice) {
                adorn = '<LNG'
            }
        }
        console.log(`put: ${put.strikePrice.toFixed(0)} ` + adorn + `\tbid: ${put.bid.toFixed(2)}\task: ${put.ask.toFixed(2)}\tdelta: ${put.delta.toFixed(1)}\ttheta: ${put.theta.toFixed(1)}`)
    })
    console.log(`===========================================================================`)

    console.log('')
    console.log(`===== CALLS ===============================================================`)
    closeToATM = false
    calls.forEach(call => {
        if ((call.strikePrice - spxLast) < minCloseToATM) {
            if (closeToATM == false) {
                console.log('---------------------------------------------------------------------------')
            }
            closeToATM = true
        }
        let adorn = ''
        if (callShort) {
            if (callShort.strikePrice == call.strikePrice) {
                adorn = '<SRT'
            }
            if (callLong.strikePrice == call.strikePrice) {
                adorn = '<LNG'
            }
        }
        console.log(`put: ${call.strikePrice.toFixed(0)} ` + adorn + `\tbid: ${call.bid.toFixed(2)}\task: ${call.ask.toFixed(2)}\tdelta: ${call.delta.toFixed(1)}\ttheta: ${call.theta.toFixed(1)}`)
    })
    console.log(`===========================================================================`)

    console.log('')
    console.log('======= RECOMMENDED PUT SPREAD =======')
    if (putShort != undefined) {
        console.log('Put Long = ' + putLong.strikePrice + ' ask = ' + putLong.ask.toFixed((2)))
        console.log('Put Short = ' + putShort.strikePrice + ' bid = ' + putShort.bid.toFixed((2)))
        console.log('Put Net Credit = ' + (putShort.bid - putLong.ask).toFixed(2))
        console.log('Put Spread Width = ' + (putShort.strikePrice - putLong.strikePrice))
        console.log('Put Spread From ATM = ' + (spxLast - putShort.strikePrice).toFixed(0))
    } else {
        console.log('NONE')
    }
    console.log('======================================')

    console.log('')
    console.log('====== RECOMMENDED CALL SPREAD =======')
    if (callShort != undefined) {
        console.log('Call Long = ' + callLong.strikePrice + ' ask = ' + callLong.ask.toFixed((2)))
        console.log('Call Short = ' + callShort.strikePrice + ' bid = ' + callShort.bid.toFixed((2)))
        console.log('Call Net Credit = ' + (callShort.bid - callLong.ask).toFixed(2))
        console.log('Call Spread Width = ' + (callLong.strikePrice - callShort.strikePrice))
        console.log('Call Spread From ATM = ' + (callShort.strikePrice - spxLast).toFixed(0))
    } else {
        console.log('NONE')
    }
    console.log('======================================')


}

function findLong(options, possibleLong)  {

    let long = undefined
    options.forEach(opt => {
        if (opt.ask >= possibleLong && long == undefined) {
            long = opt
        }
        if (long != undefined && opt.ask == long.ask) {
            long = opt
        }
    })
    return long
}


function findShort(options, long, last, type) {

    // const newOptions = options.reverse()
    const newOptions = options

    let short = undefined

    if (type === 'PUT') {
        newOptions.forEach(opt => {
            if (
                short == undefined &&
                opt.strikePrice <= (last - minCloseToATM)  &&
                opt.strikePrice - long.strikePrice <= maxSpread &&
                opt.bid - long.ask >= minNetCredit &&
                opt.bid - long.ask <= maxNetCredit
            ) {
                short = opt
            }
        })
        return short
    }

    if (type === 'CALL') {
        newOptions.forEach(opt => {
            if (
                short == undefined &&
                opt.strikePrice >= (last + minCloseToATM) &&
                long.strikePrice - opt.strikePrice <= maxSpread &&
                opt.bid - long.ask >= minNetCredit &&
                opt.bid - long.ask <= maxNetCredit

            ) {
                short = opt
            }
        })
        return short
    }


   // whichIsBetter

    // ask Good 0.10 ------------ 1.00 Bad
    // credit  1.00 ----------- 1.80 ------------- 2.60
    // FTM   bad 10 ------------ 50 good
    // width good 5 -------- 50


}

function convertEpochToLocalTime(epoch) {
    const date = new Date(epoch)
    const formattedDate = date.toLocaleString()
    return formattedDate
}

