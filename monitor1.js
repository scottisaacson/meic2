const fs = require('fs');
const path = require('path');


const dateObject = new Date();
const day = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`
// const day = '2024-10-31'
const dataDirName = '/Users/scottike/SPX/' + day + '/data'



const nf = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
})

const pnf = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
})

let spxSymbol
let spxLast
let spxQuoteTime
let putMap
let callMap

const startTime = "07:30:00"
const stopTime = "14:00:00"

const tradingAccountSize = 200000

function getFilesInDirectory(dirPath) {
    try {
        // Read directory contents
        const files = fs.readdirSync(dirPath);

        // Map files with full path and filter only regular files (not directories)
        const fileList = files
            .map(file => path.join(dirPath, file))
            .filter(file => fs.statSync(file).isFile())
            .filter(file => !(file.endsWith('now.json')))
        return fileList
    } catch (error) {
        console.error("Error reading directory:", error)
        return []
    }
}

function getOptionData(filename, id) {

    let data
    try {
        data = fs.readFileSync(filename, 'utf8');
        // console.log(data);
    } catch (err) {
        console.error(err);
    }


    if (data) {

        // Parse the JSON data
        const jsonData = JSON.parse(data)

        spxSymbol = jsonData.underlying.symbol
        spxLast = jsonData.underlying.last
        spxQuoteTime = jsonData.underlying.quoteTime

        putMap = jsonData.putExpDateMap[day + ':0']
        callMap = jsonData.callExpDateMap[day + ':0']

        const spxQuoteTimeDate = new Date(spxQuoteTime)
        const spXQuoteTimeString = getTimeStringColon(spxQuoteTimeDate)

        if (compareTimeEalier(spXQuoteTimeString, startTime) || compareTimeLater(spXQuoteTimeString, stopTime)) {
            return
        }


        Object.keys(putMap).forEach(key => {
            const opt = putMap[key][0]
            if (id == opt.symbol) {
                 console.log(`Time: ${spXQuoteTimeString}, Mark: ${opt.bid.toFixed(2)}`);
            }
        })

        Object.keys(callMap).forEach(key => {
            const opt = callMap[key][0]
            if (id == opt.symbol) {
                console.log(`Time: ${spXQuoteTimeString}, Mark: ${opt.bid.toFixed(2)}`);
            }
        })

    }

}


function getAsk(filename, pos) {

    let data
    try {
        data = fs.readFileSync(filename, 'utf8')
    } catch (err) {
        console.error(err)
    }


    if (data) {

        // Parse the JSON data
        const jsonData = JSON.parse(data)

        spxSymbol = jsonData.underlying.symbol
        spxLast = jsonData.underlying.last
        spxQuoteTime = jsonData.underlying.quoteTime

        putMap = jsonData.putExpDateMap[day + ':0']
        callMap = jsonData.callExpDateMap[day + ':0']

        const spxQuoteTimeDate = new Date(spxQuoteTime)
        const spxQuoteTimeString = getTimeStringColon(spxQuoteTimeDate)

        if (compareTimeEalier(spxQuoteTimeString, startTime) || compareTimeLater(spxQuoteTimeString, stopTime)) {
            return undefined
        }

        if (pos.type == 'P') {
            let returnObject
            Object.keys(putMap).forEach(key => {
                const opt = putMap[key][0]
                if (pos.shortSymbol == opt.symbol) {
                    returnObject = {
                        time: spxQuoteTimeString,
                        ask: opt.ask
                    }
                }
            })
            return returnObject
        }

        if (pos.type == 'C') {
            let returnObject
            Object.keys(putMap).forEach(key => {
                const opt = callMap[key][0]
                if (pos.shortSymbol == opt.symbol) {
                    returnObject = {
                        time: spxQuoteTimeString,
                        ask: opt.ask
                    }
                }
            })
            return returnObject
        }

        return undefined

    }

}

function getBid(filename, pos) {

    let data
    try {
        data = fs.readFileSync(filename, 'utf8')
    } catch (err) {
        console.error(err)
    }


    if (data) {

        // Parse the JSON data
        const jsonData = JSON.parse(data)

        spxSymbol = jsonData.underlying.symbol
        spxLast = jsonData.underlying.last
        spxQuoteTime = jsonData.underlying.quoteTime

        putMap = jsonData.putExpDateMap[day + ':0']
        callMap = jsonData.callExpDateMap[day + ':0']

        const spxQuoteTimeDate = new Date(spxQuoteTime)
        const spxQuoteTimeString = getTimeStringColon(spxQuoteTimeDate)

        if (compareTimeEalier(spxQuoteTimeString, startTime) || compareTimeLater(spxQuoteTimeString, stopTime)) {
            return undefined
        }

        if (pos.type == 'P') {
            let returnObject
            Object.keys(putMap).forEach(key => {
                const opt = putMap[key][0]
                if (pos.longSymbol == opt.symbol) {
                    returnObject = {
                        time: spxQuoteTimeString,
                        bid: opt.bid
                    }
                }
            })
            return returnObject
        }

        if (pos.type == 'C') {
            let returnObject
            Object.keys(putMap).forEach(key => {
                const opt = callMap[key][0]
                if (pos.longSymbol == opt.symbol) {
                    returnObject = {
                        time: spxQuoteTimeString,
                        bid: opt.bid
                    }
                }
            })
            return returnObject
        }

        return undefined

    }

}

function getPriceAtTimeForLong (pos, time) {

    let bids = []
    let files = getFilesInDirectory(dataDirName)
    files.forEach((file) => {
        let bid = getBid(file, pos)
        if (bid) {
            bids.push(bid)
        }
    })

    let returnObject
    bids.forEach((bid) => {
        if (!returnObject) {
            if (compareTimeEalier(bid.time, time)) {
                // console.log(`Time: ${bid.time}, Bid: ${bid.bid.toFixed(2)}`)
            } else {
                returnObject = bid
            }
        }
    })
    return returnObject
}


function monitor () {

    const positionsName = 'positions'
    const fileRoot = '/Users/scottike/SPX/'
    const positionsFile = fileRoot + day + '/' + positionsName  + '/' + positionsName + '.json'

    let putSpreadDescription
    let callSpreadDescription
    let spreadDescription
    let type
    let enterTime
    let exitTime


    let positions
    try {
        const fileData = fs.readFileSync(positionsFile, 'utf8')
        positions = JSON.parse(fileData)
    } catch (err) {
        positions = []
    }

    let list = []
    positions.forEach((ic) => {
        let pos = {
            shortSymbol: ic.putSpread.shortID,
            shortStop: ic.ic.putShortStop,
            shortSTO: ic.putSpread.bid,
            short: ic.putSpread.short,
            type: 'P',
            time: ic.underlying.time,
            longSymbol: ic.putSpread.longID,
            longBTO: ic.putSpread.ask,
            long: ic.putSpread.long,
            netCredit: ic.putSpread.netCredit,
            width: ic.putSpread.width
        }
        list.push(pos)
        pos = {
            shortSymbol: ic.callSpread.shortID,
            shortStop: ic.ic.callShortStop,
            shortSTO: ic.callSpread.bid,
            short: ic.callSpread.short,
            type: 'C',
            time: ic.underlying.time,
            longSymbol: ic.callSpread.longID,
            longBTO: ic.callSpread.ask,
            long: ic.callSpread.long,
            netCredit: ic.callSpread.netCredit,
            width: ic.callSpread.width
        }
        list.push(pos)
    })

    // for the day
    let dayTotal = 0

    // keep track of spreads
    let spreadCount = 0
    let spreadWinnerCount = 0
    let spreadLoserCount = 0
    let spreadTotal = 0
    let thisBuyingPower
    let dayBuyingPower
    let thisRisk
    let dayRisk


    // keep track of ICs
    let ironCondorSpreadCount = 0
    let ironCondorStopCount = 0
    let ironCondorTotal = 0

    let ironCondorCount = 0
    let ironCondorWinnerCount = 0
    let ironCondorLoserCount = 0
    let ironCondorBECount = 0

    dayTotal = 0
    spreadCount = 0
    spreadWinnerCount = 0
    spreadLoserCount = 0
    thisBuyingPower = 0
    dayBuyingPower = 0
    thisRisk = 0
    dayRisk = 0

    ironCondorStopCount = 0
    ironCondorWinnerCount = 0
    ironCondorLoserCount = 0
    ironCondorBECount = 0

    let shortEnterStatus
    let longEnterStatus
    let shortExitStatus
    let longExitStatus
    let stopAskPrice
    let stopBidPrice
    let stopped
    let askTime
    let open

    list.forEach((pos) => {

        // Each POS is a new spread so start the spread data
        // Each IC is two spreads and so if this is the first spread, start the IC data

        if (ironCondorSpreadCount == 0) {
            ironCondorTotal = 0
            ironCondorStopCount = 0
        }

        // new spread
        spreadTotal = 0
        enterTime = pos.time
        thisBuyingPower = 0
        thisRisk = 0

        spreadTotal += Number(pos.shortSTO)
        spreadTotal -= Number(pos.longBTO)

        thisRisk = pos.shortStop - pos.netCredit
        thisBuyingPower = (pos.width * 50)

        if (pos.type == 'P') {
            type = 'PUT'
            putSpreadDescription = '' + type + ' ' + pos.short + '/' + pos.long
            spreadDescription = putSpreadDescription
        } else {
            type = 'CALL'
            callSpreadDescription = '' + type + ' ' + pos.short + '/' + pos.long
            spreadDescription = callSpreadDescription
        }

        let asks = []
        let files = getFilesInDirectory(dataDirName)
        files.forEach((file) => {
            let ask = getAsk(file, pos)
            if (ask) {
                asks.push(ask)
            }
        })

        stopped = false
        asks.forEach((ask) => {
            askTime = ask.time
            if (!compareTimeEalier(ask.time, pos.time)) {
                if (stopped == false) {
                    if (Number(ask.ask) > Number(pos.shortStop)) {
                        // we are now stopping out this position
                        stopped = true
                        ironCondorStopCount++
                        stopAskPrice = ask.ask.toFixed(2)
                        exitTime = ask.time
                        spreadTotal -= Number(ask.ask)

                        let bid = getPriceAtTimeForLong(pos, ask.time)
                        if (bid) {
                            stopBidPrice = bid.bid.toFixed(2)
                            spreadTotal += Number(bid.bid)
                        } else {
                            stopBidPrice = 'ERROR'
                            spreadTotal += 0
                        }
                    } else {
                        // this price does not stop us out
                        // just keep going
                    }
                } else {
                    // we have already been stopped out, ignore this price
                }
            } else {
                // this price is too early, ignore it
            }
        })

        shortEnterStatus = 'SHORT ' + pos.short + ' STO: ' + pos.shortSTO
        longEnterStatus = 'LONG ' + pos.long + ' BTO: ' + pos.longBTO

        if (stopped == false) {
            // we might be expired, or we might be pending
            open = true
            if (compareTimeEalier(askTime,'13:59:00' )) {
                exitTime = 'PENDING'
            } else {
                exitTime = 'EXPIRED'
            }
            shortExitStatus = 'SHORT ' + pos.short + ' ' + exitTime
            longExitStatus = 'LONG ' + pos.long + ' ' + exitTime
        } else {
            open = false
            shortExitStatus = 'SHORT ' + pos.short + ' BTC: ' + stopAskPrice
            longExitStatus = 'LONG ' + pos.long + ' STC: ' + stopBidPrice
        }

        // figure out the spread stuff
        spreadCount++
        if (Number(spreadTotal) >= 0) {
            spreadWinnerCount++
        } else {
            spreadLoserCount++
        }

        let status
        if (open && (exitTime == 'PENDING')) {
            status = 'OPEN'
        } else if (open && (exitTime == 'EXPIRED')) {
            status = 'CLOSED - EXPIRED'
        } else {
            status = 'CLOSED - STOPPED'
        }
        console.log('===== ' + spreadDescription + ' ' + status + ' ====================================')
        console.log(shortEnterStatus)
        console.log(longEnterStatus)
        console.log(shortExitStatus)
        console.log(longExitStatus)
        console.log('Spread P/L: ' + nf.format(spreadTotal * 100))
        console.log('Risk: -' + nf.format(thisRisk * 100) + ' (' + pnf.format((thisRisk * 100)/tradingAccountSize) + ')' )
        console.log('Buying Power: ' + nf.format(thisBuyingPower))
        console.log('Lifetime: enter = ' + enterTime + ', exit = ' + exitTime)
        console.log('==============================================================')


        // now figure out the IC stuff
        if (ironCondorSpreadCount == 0 ) {
            ironCondorSpreadCount = 1
            ironCondorTotal += spreadTotal
        } else {
            ironCondorSpreadCount = 0
            ironCondorTotal += spreadTotal
            ironCondorCount++
            if (ironCondorStopCount == 0) {
                ironCondorWinnerCount++
            } else if (ironCondorStopCount == 2) {
                ironCondorLoserCount++
            } else {
                ironCondorBECount++
            }
            console.log('***** Iron Condor: ' +  putSpreadDescription + ' and ' + callSpreadDescription + ' **********')
            console.log('Iron Condor P/L: ' + ironCondorTotal.toFixed(2))
            console.log('Iron Condor Stops: ' + ironCondorStopCount)
            console.log('***************************************************************\n')
        }

        dayTotal += Number(spreadTotal)
        dayRisk += thisRisk
        dayBuyingPower += thisBuyingPower
    })


    const formattedDayRisk = nf.format(dayRisk * 100)

    const formattedDayTotal = nf.format(dayTotal * 100)

    const formattedDayBuyingPower = nf.format(dayBuyingPower)

    console.log('------------------------------------------------------------------------------')
    console.log('Day P/L: ' + formattedDayTotal)
    console.log('Day Risk: -' + formattedDayRisk + ' (' + pnf.format((dayRisk * 100)/tradingAccountSize) + ')' )
    console.log('Day Buying Power: ' + formattedDayBuyingPower)
    console.log(
        'Spreads: ' + spreadCount +
        ',       Winners: ' + spreadWinnerCount + ' (' + ((spreadWinnerCount/spreadCount)*100).toFixed(0) +
        '%),       Losers: ' + spreadLoserCount + ' (' + ((spreadLoserCount/spreadCount)*100).toFixed(0) +
        '%)'
    )
    console.log(
        'Iron Condors: ' + ironCondorCount +
        ',   Winners: ' + ironCondorWinnerCount + ' (' + ((ironCondorWinnerCount/ironCondorCount)*100).toFixed(0) +
        '%),       Losers: ' + ironCondorLoserCount + ' (' + ((ironCondorLoserCount/ironCondorCount)*100).toFixed(0) +
        '%),       BEs: ' + ironCondorBECount + ' (' + + ((ironCondorBECount/ironCondorCount)*100).toFixed(0) +
        '%)'
    )
    console.log('-------------------------------------------------------------------------------')

}


function convertEpochToLocalTime(epoch) {
    const date = new Date(epoch)
    const formattedDate = date.toLocaleString()
    return formattedDate
}

function getTimeStringColon(date) {
    const p = new Intl.DateTimeFormat('en', {
        hour:'2-digit',
        minute:'2-digit',
        second:'2-digit',
        hour12: false
    }).formatToParts(date).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    return `${p.hour}:${p.minute}:${p.second}`
}


function compareTimeEalier(time1, time2) {
    const parts1 = time1.split(':')
    const parts2 = time2.split(':')
    if (Number(parts1[0]) < Number(parts2[0])) {
        return true
    }
    if (Number(parts1[0]) == Number(parts2[0]) && Number(parts1[1]) < Number(parts2[1])) {
        return true
    }
    if (Number(parts1[0]) == Number(parts2[0]) && Number(parts1[1]) == Number(parts2[1]) && Number(parts1[2]) < Number(parts2[2])) {
        return true
    }
    return false
}

function compareTimeLater(time1, time2) {
    const parts1 = time1.split(':')
    const parts2 = time2.split(':')
    if (Number(parts1[0]) > Number(parts2[0])) {
        return true
    }
    if (Number(parts1[0]) == Number(parts2[0]) && Number(parts1[1]) > Number(parts2[1])) {
        return true
    }
    if (Number(parts1[0]) == Number(parts2[0]) && Number(parts1[1]) == Number(parts2[1]) && Number(parts1[2]) >  Number(parts2[2])) {
        return true
    }
    return false
}




monitor()
