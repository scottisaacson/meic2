// Import the 'fs' module to interact with the file system
const fs = require('fs')

const day = '2024-10-28'
const fileName = '/Users/scottike/SPX/data/' + day + '/now.json'
const optionChainKey = day + ':0'

const minCloseToATM = 10
let maxCloseToATMCalls
let maxCloseToATMPuts

const maxSpread = 50
let minSpreadCalls
let minSpreadPuts


const minNetCredit = 0.80
const optNetCredit = 1.80
const maxNetCredit = 2.80
let minActualNetCreditCalls
let maxActualNetCreditCalls
let minActualNetCreditPuts
let maxActualNetCreditPuts


const minLong = 0.10
const maxLong = 1.00
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


// Read the JSON file asynchronously
fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading the file:", err)
        return
    }

    // Parse the JSON data
    rawData = JSON.parse(data)

    prepData()

    findCandidates()

    processCandidates()

    getVectorRecommendation()

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

function findCandidates() {

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
                    callCandidates.push(callCandidate)
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
                    putCandidates.push(putCandidate)
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

    s = {
        symbol: spxSymbol,
        last: spxLast.toFixed(0),
        time: convertEpochToLocalTime(spxTime)
    }

    if (putShort) {
        tps = {
            short: putShort.strikePrice.toFixed(0),
            bid: putShort.bid.toFixed(2),
            shortSymbol: '.SPXW' + shortDay + 'P' + putShort.strikePrice.toFixed(0),
            shortID: 'SPXW  ' + shortDay + 'P0' + putShort.strikePrice.toFixed(0) + '000',
            long: putLong.strikePrice.toFixed(0),
            ask: putLong.ask.toFixed(2),
            longSymbol: '.SPXW' + shortDay + 'P' + putLong.strikePrice.toFixed(0),
            longID: 'SPXW  ' + shortDay + 'P0' + putLong.strikePrice.toFixed(0) + '000',
            netCredit: (putShort.bid - putLong.ask).toFixed(2),
            width: (putShort.strikePrice - putLong.strikePrice).toFixed(0),
            close: (spxLast - putShort.strikePrice).toFixed(0)
        }
    }

    if (callShort) {
        tcs = {
            short: callShort.strikePrice.toFixed(0),
            bid: callShort.bid.toFixed(2),
            shortSymbol: '.SPXW' + shortDay + 'C' + callShort.strikePrice,
            shortID: 'SPXW  ' + shortDay + 'C0' + callShort.strikePrice.toFixed(0) + '000',
            long: callLong.strikePrice.toFixed(0),
            ask: callLong.ask.toFixed(2),
            longSymbol: '.SPXW' + shortDay + 'C' + callLong.strikePrice,
            longID: 'SPXW  ' + shortDay + 'C0' + callLong.strikePrice.toFixed(0) + '000',
            netCredit: (callShort.bid - callLong.ask).toFixed(2),
            width: (callLong.strikePrice - callShort.strikePrice).toFixed(0),
            close: (callShort.strikePrice - spxLast).toFixed(0)
        }
    }

    let ic
    if (callShort && putShort) {
        ic = {
            putShortStop: (Number(tps.netCredit) + Number(tcs.netCredit) - 0.1 + (Number(tps.ask) * 1.2)).toFixed(2),
            callShortStop: (Number(tps.netCredit) + Number(tcs.netCredit) - 0.1 + (Number(tcs.ask) * 1.2)).toFixed(2),
            totalCredit: (Number(tcs.netCredit) + Number(tps.netCredit)).toFixed(2)
        }
    }

    let r = {
        underlying: s,
        putSpread: tps,
        callSpread: tcs,
        ic: ic
    }

    console.log(JSON.stringify(r, null, 2))

}


function convertEpochToLocalTime(epoch) {
    const date = new Date(epoch)
    const formattedDate = date.toLocaleString()
    return formattedDate
}

