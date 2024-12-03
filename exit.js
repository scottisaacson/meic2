const fs = require('fs');
const path = require('path');


const dateObject = new Date();
const day = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`
const dataDirName = '/Users/scottike/SPX/' + day + '/data'


let spxSymbol
let spxLast
let spxQuoteTime
let putMap
let callMap

const startTime = "07:30:00"
const stopTime = "14:00:00"

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


function getPriceAtTimeForShort (pos, time) {

    let asks = []
    let files = getFilesInDirectory(dataDirName)
    files.forEach((file) => {
        let ask = getAsk(file, pos)
        if (ask) {
            asks.push(ask)
        }
    })

    let returnObject
    asks.forEach((ask) => {
        if (!returnObject) {
            if (compareTimeEalier(ask.time, time)) {
                // console.log(`Time: ${bid.time}, Bid: ${bid.bid.toFixed(2)}`)
            } else {
                returnObject = ask
            }
        }
    })
    return returnObject
}


function monitor () {

    const positionsName = 'positions'
    const fileRoot = '/Users/scottike/SPX/'
    const positionsFile = fileRoot + day + '/' + positionsName  + '/' + positionsName + '.json'

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
            type: 'P',
            time: ic.underlying.time,
            longSymbol: ic.putSpread.longID,
            longBTO: ic.putSpread.ask,
            netCredit: ic.putSpread.netCredit
        }
        list.push(pos)
        pos = {
            shortSymbol: ic.callSpread.shortID,
            shortStop: ic.ic.callShortStop,
            shortSTO: ic.callSpread.bid,
            type: 'C',
            time: ic.underlying.time,
            longSymbol: ic.callSpread.longID,
            longBTO: ic.callSpread.ask,
            netCredit: ic.callSpread.netCredit
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

    ironCondorStopCount = 0
    ironCondorWinnerCount = 0
    ironCondorLoserCount = 0
    ironCondorBECount = 0


    list.forEach((pos) => {

        // Each POS is a new spread so start the spread data
        // Each IC is two spreads and so if this is the first spread, start the IC data
        if (ironCondorSpreadCount == 0) {
            ironCondorTotal = 0
            ironCondorStopCount = 0
        }
        spreadTotal = 0


        console.log('======================')

        console.log('SHORT STO: ' + Number(pos.shortSTO).toFixed(2))
        spreadTotal += Number(pos.shortSTO)
        console.log('LONG  BTO: -' + Number(pos.longBTO).toFixed(2))
        spreadTotal -= Number(pos.longBTO)


        let asks = []
        let files = getFilesInDirectory(dataDirName)
        files.forEach((file) => {
            let ask = getAsk(file, pos)
            if (ask) {
                asks.push(ask)
            }
        })

        let stopped = false
        asks.forEach((ask) => {
            if (!compareTimeEalier(ask.time, pos.time.replace(/-/g, ":"))) {
                if (stopped == false) {
                    if (Number(ask.ask) > Number(pos.shortStop)) {
                        stopped = true
                        ironCondorStopCount++
                        console.log(`SHORT STOPPED BTC: -${ask.ask.toFixed(2)}`)
                        spreadTotal -= Number(ask.ask)
                        let bid = getPriceAtTimeForLong(pos, ask.time)
                        if (bid) {
                            console.log(`LONG EXIT STC: ${bid.bid.toFixed(2)}`)
                            spreadTotal += Number(bid.bid)
                        } else {
                            console.log(`LONG SOLD, STC ERROR`)
                        }
                    } else {
                        // console.log(`Time*: ${ask.time}, Ask: ${ask.ask.toFixed(2)}`)
                    }
                }
            } else {
                // console.log(`Time: ${ask.time}, Ask: ${ask.ask.toFixed(2)}`)
            }

        })
        if (stopped == false) {

            const currentTime = new Date()
            currentTime.setMinutes(currentTime.getMinutes() - 3)
            const timeNowFormatted = getTimeStringColon(currentTime.valueOf())

            let bid = getPriceAtTimeForLong(pos, timeNowFormatted)
            let ask = getPriceAtTimeForShort(pos, timeNowFormatted)

            let askValue = 0
            let bidValue = 0
            if (ask && ask.ask) {
                askValue = ask.ask
            }
            if (bid && bid.bid) {
                bidValue = bid.bid
            }
            console.log(`SHORT EXIT BTC: -${askValue.toFixed(2)}`)
            spreadTotal -= Number(askValue)
            console.log(`LONG EXIT STC: ${bidValue.toFixed(2)}`)
            spreadTotal -= Number(bidValue)

        }

        // figure out the spread stuff
        console.log('Spread P/L: ' + Number(spreadTotal).toFixed(2))
        spreadCount++
        if (Number(spreadTotal) >= 0) {
            spreadWinnerCount++
        } else {
            spreadLoserCount++
        }
        console.log('======================')


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
            console.log('**********************')
            console.log('IC P/L: ' + ironCondorTotal.toFixed(2))
            console.log('IC Stops: ' + ironCondorStopCount)
            console.log('**********************')
        }

        dayTotal += Number(spreadTotal)
    })

    console.log('----------------------')
    console.log('DAY P/L: ' + Number(dayTotal*100).toFixed(2))
    console.log(
        'Spreads: ' + spreadCount +
        ',       Winners: ' + spreadWinnerCount + ' (' + ((spreadWinnerCount/spreadCount)*100).toFixed(0) +
        '%),       Losers: ' + spreadLoserCount + ' (' + ((spreadLoserCount/spreadCount)*100).toFixed(0) +
        '%)'
    )
    console.log(
        'ICs: ' + ironCondorCount +
        ',           Winners: ' + ironCondorWinnerCount + ' (' + ((ironCondorWinnerCount/ironCondorCount)*100).toFixed(0) +
        '%),       Losers: ' + ironCondorLoserCount + ' (' + ((ironCondorLoserCount/ironCondorCount)*100).toFixed(0) +
        '%),       BEs: ' + ironCondorBECount + ' (' + + ((ironCondorBECount/ironCondorCount)*100).toFixed(0) +
        '%)'
    )
    console.log('----------------------')

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
