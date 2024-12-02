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
    //const positionsFile = fileRoot + day + '/' + positionsName  + '/' + positionsName + '-EARLY.json'
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
            netCredit: ic.putSpread.netCredit,
            strikePrice: ic.putSpread.short
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
            netCredit: ic.callSpread.netCredit,
            strikePrice: ic.callSpread.short
        }
        list.push(pos)
    })

    list.forEach((pos) => {

        console.log('======================')
        const t = (pos.type == 'P' ? 'PUT' : 'CALL')
        console.log(t + ' ' + pos.strikePrice + ' ' + pos.shortStop)

        let asks = []
        let files = getFilesInDirectory(dataDirName)
        files.forEach((file) => {
            let ask = getAsk(file, pos)
            if (ask) {
                asks.push(ask)
            }
        })

        let stopped = false
        let minAsk
        let maxAsk
        let currentTime
        let currentAsk
        // for every possible ask for this position
        asks.forEach((ask) => {
            // look at the ask, only after we entered the position
            if (!compareTimeEalier(ask.time, pos.time)) {
                currentTime = ask.time
                if (stopped == false) {
                    if (Number(ask.ask) > Number(pos.shortStop)) {
                        stopped = true
                        // console.log('STOPPED ' + ask.time + ' ' + ask.ask.toFixed(2))
                    } else {
                        // console.log('TRACKING ' + ask.time + ' ' + ask.ask.toFixed(2))
                    }
                    currentAsk = ask.ask
                    if (minAsk == undefined ) {
                        minAsk = ask.ask
                    } else if (ask.ask <= minAsk) {
                        minAsk = ask.ask
                    }
                    if (maxAsk == undefined ) {
                        maxAsk = ask.ask
                    } else if (ask.ask >= maxAsk) {
                        maxAsk = ask.ask
                    }
                }
            } else {
                // console.log(`Time: ${ask.time}, Ask: ${ask.ask.toFixed(2)}`)
            }
        })
        if (stopped) {
            console.log('STOPPED ' /* + currentTime + ' '*/ + maxAsk.toFixed(2))
        } else {
            // console.log('TRACKING ' /* + currentTime + ' '*/ + 'min=' + minAsk.toFixed(2) + ', max=' + maxAsk.toFixed(2))
            console.log('CURRENT: ' /* + currentTime + ' '*/ + currentAsk.toFixed(2) + ', MAX: ' + maxAsk.toFixed(2))
        }

    })

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
