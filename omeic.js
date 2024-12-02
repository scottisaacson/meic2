const fs = require('fs')

let day

let dataFileName
let optionChainKey
let fileContent

let minCloseToATM = 10
let fallbackMinCloseToATM = 4
let maxCloseToATMCalls
let maxCloseToATMPuts

let maxSpread = 50
let fallbackMaxSpread = 50
let minSpreadCalls
let minSpreadPuts

let minNetCredit = 0.80
let maxNetCredit = 2.80
let fallbackMinNetCredit = 0.50
let fallbackMaxNetCredit = 3.10


let minActualNetCreditCalls
let maxActualNetCreditCalls
let minActualNetCreditPuts
let maxActualNetCreditPuts


let minLong = 0.10
let maxLong = 1.00
let fallbackMinLong = 0.10
let fallbackMaxLong = 5.00
let maxLongCalls
let maxLongPuts

const weightCredit = 40
const weightLong = 50
const weightSpread = 5
const weightClose = 5


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

let putCandidates = []
let callCandidates = []

let positions


const SPX_HOME = process.env.SPX_HOME
const DTE = process.env.DTE

const fileRoot =    SPX_HOME + '/'
const omeicName = 'omeic'
const recommendationName = 'recommendation'
const positionsName = 'positions'

let positionsFile

function main () {

    const desiredDate = fs.readFileSync(SPX_HOME + '/.date', "utf-8")
    if (desiredDate === 'today') {
        const dateObject = new Date();
        day = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`
    } else {
        day = desiredDate
    }

    dataFileName = SPX_HOME + '/' + day + '/data/now.json'
    optionChainKey = day + ':' + DTE

    try {

        fileContent = fs.readFileSync(dataFileName, 'utf8')
        if (!fileContent) {
            console.log('nada')
            return
        }
    } catch (err) {
        // console.err('file read error: ' + err)
        console.log('nada')
        return
    }

    // Parse the JSON data
    rawData = JSON.parse(fileContent)

    prepData()

    getPositions()

    findCandidates()

    processCandidates()

    getVectorRecommendation()

    if (!putLong || !putShort || !callLong || !callShort) {

        minLong = fallbackMinLong
        maxLong = fallbackMaxLong
        minCloseToATM = fallbackMinCloseToATM
        minNetCredit = fallbackMinNetCredit
        maxNetCredit = fallbackMaxNetCredit

        findCandidates()

        processCandidates()

        getVectorRecommendation()

    }

    printData()

    placeOrder()

}

main()

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
        if (optSummary.strikePrice < spxLast && optSummary.ask >= minLong && optSummary.bid > 0) {
            // console.log('ACCEPTING PUT ' + optSummary.strikePrice.toFixed(0))
            puts.push(optSummary)
        } else {
            // console.log('REJECTING PUT ' + optSummary.strikePrice.toFixed(0))
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
        if (optSummary.strikePrice > spxLast && optSummary.ask >= minLong && optSummary.bid > 0) {
            // console.log('ACCEPTING CALL ' + optSummary.strikePrice.toFixed(0))
            calls.push(optSummary)
        } else {
            // console.log('REJECTING CALL ' + optSummary.strikePrice.toFixed(0))
        }
    })

    calls.sort((a, b) => Number(b.strikePrice) - Number(a.strikePrice))


}

function findCandidates() {

    let shortPositions = []
    let longPositions = []

    //   {
    //     "underlying": {
    //     },
    //     "putSpread": {
    //       "long": "5960",
    //       "longSymbol": ".SPXW241127P5960",
    //       "longID": "SPXW  241127P05960000",
    //       "short": "5995",
    //       "shortSymbol": ".SPXW241127P5995",
    //       "shortID": "SPXW  241127P05995000",
    //     },
    //     "callSpread": {
    //       "long": "6015",
    //       "longSymbol": ".SPXW241127C6015",
    //       "longID": "SPXW  241127C06015000",
    //       "short": "6005",
    //       "shortSymbol": ".SPXW241127C6005",
    //       "shortID": "SPXW  241127C06005000",
    //     },
    //     "ic": {
    //     }
    //   }

    positions.forEach((pos) => {
        if (!longPositions.includes(pos.callSpread.long)) {
            longPositions.push(pos.callSpread.long)
        }
        if (!longPositions.includes(pos.putSpread.long)) {
            longPositions.push(pos.putSpread.long)
        }
        if (!shortPositions.includes(pos.callSpread.short)) {
            shortPositions.push(pos.callSpread.short)
        }
        if (!shortPositions.includes(pos.putSpread.short)) {
            shortPositions.push(pos.putSpread.short)
        }
    })

    //[
    //   {
    //     "symbol": "SPXW  241127C06000000",
    //     "description": "SPXW 11/27/2024 6000.00 C",
    //     "bid": 0.1,
    //     "ask": 0.15,
    //     "last": 0.1,
    //     "delta": 0.133,
    //     "theta": -0.125,
    //     "strikePrice": 6000
    //   }
    // ]

    let counter = 0
    calls.forEach((shortLeg) => {
        calls.forEach((longLeg) => {
            if (shortLeg.strikePrice < longLeg.strikePrice) {
                let callCandidate = {
                        id: ++counter,
                        width: longLeg.strikePrice - shortLeg.strikePrice,
                        closeToATM: shortLeg.strikePrice - spxLast,
                        longLegAsk: longLeg.ask,
                        netCredit: shortLeg.bid - longLeg.ask,
                        longLeg: longLeg,
                        shortLeg: shortLeg
                    }

                if (
                    callCandidate.longLegAsk >= minLong &&
                    callCandidate.longLegAsk <= maxLong &&
                    callCandidate.closeToATM >= minCloseToATM &&
                    callCandidate.width <= maxSpread &&
                    callCandidate.netCredit >= minNetCredit &&
                    callCandidate.netCredit <= maxNetCredit
                ) {
                    if (
                        !shortPositions.includes(longLeg.strikePrice.toFixed(0)) &&
                        !longPositions.includes(shortLeg.strikePrice.toFixed(0))
                    ) {
                        callCandidates.push(callCandidate)
                    }
                    // } else {
                    //     if (shortPositions.includes(longLeg.strikePrice.toFixed(0))) {
                    //         console.log(longLeg.strikePrice.toFixed(0) + " BTO after a STO would be a BTC")
                    //     } else {
                    //         console.log(shortLeg.strikePrice.toFixed(0) + " STO after a BTO would be a STC")
                    //     }
                    // }
                }
            }
        })
    })

    counter = 0
    puts.forEach((shortLeg) => {
        puts.forEach((longLeg) => {
            if (shortLeg.strikePrice > longLeg.strikePrice) {
                let putCandidate = {
                    id: ++counter,
                    width: shortLeg.strikePrice - longLeg.strikePrice,
                    closeToATM: spxLast - shortLeg.strikePrice,
                    longLegAsk: longLeg.ask,
                    netCredit: shortLeg.bid - longLeg.ask,
                    longLeg: longLeg,
                    shortLeg: shortLeg
                }

                if (
                    putCandidate.longLegAsk >= minLong &&
                    putCandidate.longLegAsk <= maxLong &&
                    putCandidate.closeToATM >= minCloseToATM &&
                    putCandidate.width <= maxSpread &&
                    putCandidate.netCredit >= minNetCredit &&
                    putCandidate.netCredit <= maxNetCredit
                ) {
                    if (
                        !shortPositions.includes(longLeg.strikePrice.toFixed(0)) &&
                        !longPositions.includes(shortLeg.strikePrice.toFixed(0))
                    ) {
                        putCandidates.push(putCandidate)
                    }
                    // } else {
                    //     if (shortPositions.includes(longLeg.strikePrice.toFixed(0))) {
                    //         console.log(longLeg.strikePrice.toFixed(0) + " BTO after a STO would be a BTC")
                    //     } else {
                    //         console.log(shortLeg.strikePrice.toFixed(0) + " STO after a BTO would be a STC")
                    //     }
                    // }
                }
            }
        })
    })

    putCandidates.forEach((candidate) => {

        if (maxCloseToATMPuts == undefined) {
            maxCloseToATMPuts = candidate.closeToATM
        } else if (candidate.closeToATM > maxCloseToATMPuts) {
            maxCloseToATMPuts = candidate.closeToATM
        }

        if (minSpreadPuts == undefined) {
            minSpreadPuts = candidate.width
        } else if (candidate.width < minSpreadPuts) {
            minSpreadPuts = candidate.width
        }

        if (maxLongPuts == undefined) {
            maxLongPuts = candidate.longLegAsk
        } else if (candidate.longLegAsk > maxLongPuts) {
            maxLongPuts = candidate.longLegAsk
        }

        if (minActualNetCreditPuts == undefined) {
            minActualNetCreditPuts = candidate.netCredit
        } else if (candidate.netCredit < minActualNetCreditPuts) {
            minActualNetCreditPuts = candidate.netCredit
        }

        if (maxActualNetCreditPuts == undefined) {
            maxActualNetCreditPuts = candidate.netCredit
        } else if (candidate.netCredit > maxActualNetCreditPuts) {
            maxActualNetCreditPuts = candidate.netCredit
        }

    })


    callCandidates.forEach((candidate) => {

        if (maxCloseToATMCalls == undefined) {
            maxCloseToATMCalls = candidate.closeToATM
        } else if (candidate.closeToATM > maxCloseToATMCalls) {
            maxCloseToATMCalls = candidate.closeToATM
        }

        if (minSpreadCalls == undefined) {
            minSpreadCalls = candidate.width
        } else if (candidate.width < minSpreadCalls) {
            minSpreadCalls = candidate.width
        }

        if (maxLongCalls == undefined) {
            maxLongCalls = candidate.longLegAsk
        } else if (candidate.longLegAsk > maxLongCalls) {
            maxLongCalls = candidate.longLegAsk
        }

        if (minActualNetCreditCalls == undefined) {
            minActualNetCreditCalls = candidate.netCredit
        } else if (candidate.netCredit < minActualNetCreditCalls) {
            minActualNetCreditCalls = candidate.netCredit
        }

        if (maxActualNetCreditCalls == undefined) {
            maxActualNetCreditCalls = candidate.netCredit
        } else if (candidate.netCredit > maxActualNetCreditCalls) {
            maxActualNetCreditCalls = candidate.netCredit
        }

    })

}

function processCandidates() {

    callCandidates.forEach((candidate) => {
        // =((C20-$C$3)/$C$4)*100
        candidate.creditMaxScore = ((candidate.netCredit-minActualNetCreditCalls)/(maxActualNetCreditCalls-minActualNetCreditCalls))*100
        //=100 - (ABS(C9-1.8)*100)
        candidate.creditScore = 100 - (Math.abs(candidate.netCredit - 1.80) * 100)
        // =100 - ((long-minLong)/rangeLong)*100
        candidate.longScore = 100 - ((candidate.longLegAsk-minLong)/(maxLong-minLong))*100
        // =100 - ((E9-$E$3)/$E$4)*100
        candidate.widthScore = 100 - ((candidate.width-minSpreadCalls)/(maxSpread-minSpreadCalls))*100
        // =100 - ((F9-$F$3)/$F$4)*100
        candidate.closeScore = ((candidate.closeToATM-minCloseToATM)/(maxCloseToATMCalls-minCloseToATM))*100
        candidate.CL = candidate.netCredit / candidate.longLegAsk
        // =SQRT( ($C$5*(100-H9)*(100-H9) + $D$5*(100-I9)*(100-I9) + $E$5*(100-J9)*(100-J9) + $F$5*(100-K9)*(100-K9)  ))
        candidate.vector = Math.sqrt(
            (weightCredit*(100-candidate.creditScore)*(100-candidate.creditScore)) +
            (weightLong*(100-candidate.longScore)*(100-candidate.longScore)) +
            (weightSpread*(100-candidate.widthScore)*(100-candidate.widthScore)) +
            (weightClose*(100-candidate.closeScore)*(100-candidate.closeScore))
        )
    })

    putCandidates.forEach((candidate) => {
        // =((C20-$C$3)/$C$4)*100
        candidate.creditMaxScore = ((candidate.netCredit-minActualNetCreditPuts)/(maxActualNetCreditPuts-minActualNetCreditPuts))*100
        //=100 - (ABS(C9-1.8)*100)
        candidate.creditScore = 100 - (Math.abs(candidate.netCredit - 1.80) * 100)
        // =100 - ((long-minLong)/rangeLong)*100
        candidate.longScore = 100 - ((candidate.longLegAsk-minLong)/(maxLong-minLong))*100
        // =100 - ((E9-$E$3)/$E$4)*100
        candidate.widthScore = 100 - ((candidate.width-minSpreadCalls)/(maxSpread-minSpreadPuts))*100
        // =100 - ((F9-$F$3)/$F$4)*100
        candidate.closeScore = ((candidate.closeToATM-minCloseToATM)/(maxCloseToATMPuts-minCloseToATM))*100
        candidate.CL = candidate.netCredit / candidate.longLegAsk
        // =SQRT( ($C$5*(100-H9)*(100-H9) + $D$5*(100-I9)*(100-I9) + $E$5*(100-J9)*(100-J9) + $F$5*(100-K9)*(100-K9)  ))
        candidate.vector = Math.sqrt(
            (weightCredit*(100-candidate.creditScore)*(100-candidate.creditScore)) +
            (weightLong*(100-candidate.longScore)*(100-candidate.longScore)) +
            (weightSpread*(100-candidate.widthScore)*(100-candidate.widthScore)) +
            (weightClose*(100-candidate.closeScore)*(100-candidate.closeScore))
        )
    })


    // console.log('puts')
    // putCandidates.forEach((put) => {
    //     console.log(put.shortLeg.strikePrice + ',' + put.longLeg.strikePrice  + ',' + put.shortLeg.bid.toFixed(2)  + ',' + put.longLeg.ask.toFixed(2)  + ',' + put.netCredit.toFixed(2)  + ',' + put.closeToATM.toFixed(0) + ',' + put.width.toFixed(0))
    // })
    //
    // console.log('calls')
    // callCandidates.forEach((call) => {
    //     console.log(call.shortLeg.strikePrice + ',' + call.longLeg.strikePrice  + ',' + call.shortLeg.bid.toFixed(2)  + ',' + call.longLeg.ask.toFixed(2)  + ',' + call.netCredit.toFixed(2)  + ',' + call.closeToATM.toFixed(0) + ',' + call.width.toFixed(0))
    // })


}


function getVectorRecommendation() {

    let putRecommendation
    putCandidates.forEach((candidate) => {
        if (putRecommendation == undefined) {
            putRecommendation = candidate
        } else if (candidate.vector < putRecommendation.vector) {
            putRecommendation = candidate
        }
    })
    if (putRecommendation) {
        putShort = putRecommendation.shortLeg
        putLong = putRecommendation.longLeg
    }

    let callRecommendation
    callCandidates.forEach((candidate) => {
        if (callRecommendation == undefined) {
            callRecommendation = candidate
        } else if (candidate.vector < callRecommendation.vector) {
            callRecommendation = candidate
        }
    })
    if (callRecommendation) {
        callShort = callRecommendation.shortLeg
        callLong = callRecommendation.longLeg
    }

}


function printData() {

    let tps
    let tcs
    let s

    const elements = day.split('-')
    elements[0] = elements[0].substring(2, 4)
    const shortDay = elements.join('')

    const timeFormatted = getTimeStringDash(new Date(spxTime))

    const omeicDir = fileRoot + day + '/' + omeicName + '/'
    const omeicRecommendationFile = omeicDir + recommendationName + '.json'
    const omeicRecommendationTimeFile = omeicDir + recommendationName + '-' + timeFormatted + '.json'


    s = {
        symbol: spxSymbol,
        last: spxLast.toFixed(0),
        time: timeFormatted,
        day: day
    }

    if (putShort) {
        tps = {
            summary: 'PUT: ' + putShort.strikePrice.toFixed(0) + '/' + putLong.strikePrice.toFixed(0) + ' ' + (putShort.bid - putLong.ask).toFixed(2),
            long: putLong.strikePrice.toFixed(0),
            ask: putLong.ask.toFixed(2),
            longSymbol: '.SPXW' + shortDay + 'P' + putLong.strikePrice.toFixed(0),
            longID: 'SPXW  ' + shortDay + 'P0' + putLong.strikePrice.toFixed(0) + '000',
            short: putShort.strikePrice.toFixed(0),
            bid: putShort.bid.toFixed(2),
            shortSymbol: '.SPXW' + shortDay + 'P' + putShort.strikePrice.toFixed(0),
            shortID: 'SPXW  ' + shortDay + 'P0' + putShort.strikePrice.toFixed(0) + '000',
            netCredit: (putShort.bid - putLong.ask).toFixed(2),
            width: (putShort.strikePrice - putLong.strikePrice).toFixed(0),
            close: (spxLast - putShort.strikePrice).toFixed(0)
        }
    } else {
        tsp = 'No PUT recommendation'
    }

    if (callShort) {
        tcs = {
            summary: 'CALL: ' + callShort.strikePrice.toFixed(0) + '/' + callLong.strikePrice.toFixed(0) + ' ' + (callShort.bid - callLong.ask).toFixed(2),
            long: callLong.strikePrice.toFixed(0),
            ask: callLong.ask.toFixed(2),
            longSymbol: '.SPXW' + shortDay + 'C' + callLong.strikePrice,
            longID: 'SPXW  ' + shortDay + 'C0' + callLong.strikePrice.toFixed(0) + '000',
            short: callShort.strikePrice.toFixed(0),
            bid: callShort.bid.toFixed(2),
            shortSymbol: '.SPXW' + shortDay + 'C' + callShort.strikePrice,
            shortID: 'SPXW  ' + shortDay + 'C0' + callShort.strikePrice.toFixed(0) + '000',
            netCredit: (callShort.bid - callLong.ask).toFixed(2),
            width: (callLong.strikePrice - callShort.strikePrice).toFixed(0),
            close: (callShort.strikePrice - spxLast).toFixed(0)
        }
    } else {
        tsc = 'No CALL recommendation'
    }

    let ic
    if (callShort && putShort) {
        ic = {
            putShortStop: (Number(tps.netCredit) + Number(tcs.netCredit) - 0.1 + (Number(tps.ask) * 1.2)).toFixed(2),
            callShortStop: (Number(tps.netCredit) + Number(tcs.netCredit) - 0.1 + (Number(tcs.ask) * 1.2)).toFixed(2),
            totalCredit: (Number(tcs.netCredit) + Number(tps.netCredit)).toFixed(2)
        }
    } else {
        ic = "No IC recommendation"
    }

    let r = {
        underlying: s,
        putSpread: tps,
        callSpread: tcs,
        ic: ic
    }

    const recommendationTime_fd = fs.openSync(omeicRecommendationTimeFile, 'w')
    try {
        const content = JSON.stringify(r, null, 2)
        fs.writeSync(recommendationTime_fd, content)
    } catch (error) {
        console.error('An error occurred while writing to the file:', error)
    } finally {
        fs.closeSync(recommendationTime_fd)
    }

    if (callShort && putShort) {

        const recommendation_fd = fs.openSync(omeicRecommendationFile, 'w')
        try {
            const content = JSON.stringify(r, null, 2)
            fs.writeSync(recommendation_fd, content)
        } catch (error) {
            console.error('An error occurred while writing to the file:', error)
        } finally {
            fs.closeSync(recommendation_fd)
        }

    } else {

        try {
            fs.unlinkSync(omeicRecommendationFile)
            // console.log('No recommendation, ' + omeicRecommendationFile + ' was successfully deleted.');
        } catch (err) {
            // console.error(`Error deleting file: ${err}`)
            // console.error(`just move on, no need to delete something that is not there`)
        }
    }

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

function getTimeStringDash(date) {
    const p = new Intl.DateTimeFormat('en', {
        hour:'2-digit',
        minute:'2-digit',
        second:'2-digit',
        hour12: false
    }).formatToParts(date).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    return `${p.hour}-${p.minute}-${p.second}`
}


function getPositions () {
    try {
        positionsFile = fileRoot + day + '/' + positionsName + '/' + positionsName + '.json'
        const fileData = fs.readFileSync(positionsFile, 'utf8')
        positions = JSON.parse(fileData)
    } catch (err) {
        positions = []
    }
}


function placeOrder () {

    const omeicDir = fileRoot + day + '/' + omeicName + '/'
    const omeicRecommendationFile = omeicDir + recommendationName + '.json'

    let recommendation
    try {
        const fileData = fs.readFileSync(omeicRecommendationFile, 'utf8')
        recommendation = JSON.parse(fileData)
    } catch (err) {
        console.log('No recommendation, do not place the order.')
        return
        // console.error(err)

    }

    getPositions()

    positions.push(recommendation)

    const positions_fd = fs.openSync(positionsFile, 'w')
    try {
        const fileData = JSON.stringify(positions, null, 2)
        fs.writeSync(positions_fd, fileData)
    } catch (error) {
        console.error('An error occurred while writing to the file:', error)
    } finally {
        fs.closeSync(positions_fd)
    }

}


