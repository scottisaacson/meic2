// Import the 'fs' module to interact with the file system
const fs = require('fs')

const day = '2024-10-28'
const fileName = '/Users/scottike/SPX/' + day + '/now.json'
const optionChainKey = day + ':1'

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
    // getCLRecommendation()
    // getEven1Recommendation()
    // getEven2Recommendation()

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

    if (putCandidates.length != 0 && callCandidates.length != 0) {

        console.log('')
        console.log('minActualNetCreditPuts = ' + minActualNetCreditPuts.toFixed(2))
        console.log('maxActualNetCreditPuts = ' + maxActualNetCreditPuts.toFixed(2))
        console.log('minActualNetCreditCalls = ' + minActualNetCreditCalls.toFixed(2))
        console.log('maxActualNetCreditCalls = ' + maxActualNetCreditCalls.toFixed(2))
        console.log('')
        console.log('maxCloseToATMPuts = ' + maxCloseToATMPuts.toFixed(0))
        console.log('maxCloseToATMCalls = ' + maxCloseToATMCalls.toFixed(0))
        console.log('')
        console.log('minSpreadPuts = ' + minSpreadPuts.toFixed(0))
        console.log('minSpreadCalls = ' + minSpreadCalls.toFixed(0))
        console.log('')
        console.log('maxLongPuts = ' + maxLongPuts.toFixed(2))
        console.log('maxLongCalls = ' + maxLongCalls.toFixed(2))

        console.log('')
        console.log('PUT CANDIDATES')
        putCandidates.forEach((candidate) => {
            // console.log('id: ' + candidate.id + '\tshort: ' + candidate.shortLeg.strikePrice.toFixed(0) + '\tlong: ' + candidate.longLeg.strikePrice.toFixed(0) + '\tnet: ' + candidate.netCredit.toFixed(2) + '\tlong: ' + candidate.longLegAsk.toFixed(2) + '\twidth: ' + candidate.width.toFixed(0) + '\tclose: ' + candidate.closeToATM.toFixed(0))
            console.log('' + candidate.shortLeg.strikePrice.toFixed(0) + '\t' + candidate.longLeg.strikePrice.toFixed(0) + '\t' + candidate.netCredit.toFixed(2) + '\t' + candidate.longLegAsk.toFixed(2) + '\t' + candidate.width.toFixed(0) + '\t' + candidate.closeToATM.toFixed(0))
        })

        console.log('')
        console.log('CALL CANDIDATES')
        callCandidates.forEach((candidate) => {
            // console.log('id: ' + candidate.id + '\tshort: ' + candidate.shortLeg.strikePrice.toFixed(0) + '\tlong: ' + candidate.longLeg.strikePrice.toFixed(0) + '\tnet: ' + candidate.netCredit.toFixed(2) + '\tlong: ' + candidate.longLegAsk.toFixed(2) + '\twidth: ' + candidate.width.toFixed(0) + '\tclose: ' + candidate.closeToATM.toFixed(0))
            console.log('' + candidate.shortLeg.strikePrice.toFixed(0) + '\t' + candidate.longLeg.strikePrice.toFixed(0) + '\t' + candidate.netCredit.toFixed(2) + '\t' + candidate.longLegAsk.toFixed(2) + '\t' + candidate.width.toFixed(0) + '\t' + candidate.closeToATM.toFixed(0))
        })
    }

}

function processCandidates() {

    // credit       1.00 -- 1.80 ---- 2.60, closer to 1.80
    // long          0.10 ------------ 1.00, lower the better
    // width        min -------- 50, lower the better
    // close        10 --------- max, higher the better
    // CL           Credit / Long
    // vector       SQRT( (W1 * C1 * C1) + (W2 * C2 * C2) + (W3 * C3 * C3) + (W4 * C4 * C4) )

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

function getCLRecommendation() {

    let putRecommendation
    putCandidates.forEach((candidate) => {
        if (putRecommendation == undefined) {
            putRecommendation = candidate
        } else if (candidate.CL > putRecommendation.CL) {
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
        } else if (candidate.CL > callRecommendation.CL) {
            callRecommendation = candidate
        }
    })
    if (callRecommendation) {
        callShort = callRecommendation.shortLeg
        callLong = callRecommendation.longLeg
    }

}




function getEven2Recommendation() {

    let ICCandidates = []
    putCandidates.forEach((pc) => {
        callCandidates.forEach((cc) => {
            let ICCandidate = {
                    putSpread: pc,
                    callSpread: cc,
                    maxCredit: Math.round(Math.max(pc.netCredit, cc.netCredit) * 100) / 100,
                    creditDiff: Math.round(Math.abs(pc.netCredit - cc.netCredit) * 100) / 100
            }
            ICCandidates.push(ICCandidate)
        })
    })

    ICCandidates.sort((a, b) => a.creditDiff - b.creditDiff)

    ICCandidates.forEach((c) => {
        console.log('' + c.creditDiff.toLocaleString(2) + '\t' + c.putSpread.netCredit.toFixed(2) + '\t' + c.callSpread.netCredit.toFixed(2))
    })

    let ICRecommendation
    ICCandidates.forEach((c) => {
        if (ICRecommendation == undefined) {
            ICRecommendation = c
        } else {
            if (c.creditDiff == ICRecommendation.creditDiff  && c.maxCredit > ICRecommendation.maxCredit) {
                ICRecommendation = c
            }
        }
    })

    if (ICRecommendation) {
        putShort = ICRecommendation.putSpread.shortLeg
        putLong = ICRecommendation.putSpread.longLeg
        callShort = ICRecommendation.callSpread.shortLeg
        callLong = ICRecommendation.callSpread.longLeg
    }

}

function getEven1Recommendation() {

    // check every put and call spread combo, and find the most even one
    // the higher the better

    let ICRecommendation
    let maxCredit
    putCandidates.forEach((pc) => {
        callCandidates.forEach((cc) => {
            if (ICRecommendation == undefined) {
                ICRecommendation = {
                    putSpread: pc,
                    callSpread: cc
                }
                maxCredit = Math.max(ICRecommendation.putSpread.netCredit, ICRecommendation.callSpread.netCredit)
            } else {
                if (
                    Math.abs(pc.netCredit - cc.netCredit) == Math.abs(ICRecommendation.putSpread.netCredit - ICRecommendation.callSpread.netCredit)
                ) {
                    if (Math.max(pc.netCredit, pc.netCredit) > maxCredit) {
                        ICRecommendation.putSpread = pc
                        ICRecommendation.callSpread = cc
                        maxCredit = Math.max(pc.netCredit, pc.netCredit)
                    }
                }
                if (
                    Math.abs(pc.netCredit - cc.netCredit) < Math.abs(ICRecommendation.putSpread.netCredit - ICRecommendation.callSpread.netCredit)
                ) {
                    ICRecommendation.putSpread = pc
                    ICRecommendation.callSpread = cc
                    // maxCredit = Math.max(pc.putSpread.netCredit, pc.callSpread.netCredit)
                }
            }
        })
    })

    if (ICRecommendation) {
        putShort = ICRecommendation.putSpread.shortLeg
        putLong = ICRecommendation.putSpread.longLeg
        callShort = ICRecommendation.callSpread.shortLeg
        callLong = ICRecommendation.callSpread.longLeg
    }

}



// function getFinalRecommendation() {
//
//     if (putCandidates.length > 0) {
//         putShort = putCandidates[0].shortLeg
//         putLong = putCandidates[0].longLeg
//     } else {
//         putShort = undefined
//     }
//
//     if (callCandidates.length > 0) {
//         callShort = putCandidates[0].shortLeg
//         callLong = putCandidates[0].longLeg
//     } else {
//         callShort = undefined
//     }
//
// }

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

// function findLong(options, possibleLong)  {
//
//     let long = undefined
//     options.forEach(opt => {
//         if (opt.ask >= possibleLong && long == undefined) {
//             long = opt
//         }
//         if (long != undefined && opt.ask == long.ask) {
//             long = opt
//         }
//     })
//     return long
// }
//
//
// function findShort(options, long, last, type) {
//
//     // const newOptions = options.reverse()
//     const newOptions = options
//
//     let short = undefined
//
//     if (type === 'PUT') {
//         newOptions.forEach(opt => {
//             if (
//                 short == undefined &&
//                 opt.strikePrice <= (last - minCloseToATM)  &&
//                 opt.strikePrice - long.strikePrice <= maxSpread &&
//                 opt.bid - long.ask >= minNetCredit &&
//                 opt.bid - long.ask <= maxNetCredit
//             ) {
//                 short = opt
//             }
//         })
//         return short
//     }
//
//     if (type === 'CALL') {
//         newOptions.forEach(opt => {
//             if (
//                 short == undefined &&
//                 opt.strikePrice >= (last + minCloseToATM) &&
//                 long.strikePrice - opt.strikePrice <= maxSpread &&
//                 opt.bid - long.ask >= minNetCredit &&
//                 opt.bid - long.ask <= maxNetCredit
//
//             ) {
//                 short = opt
//             }
//         })
//         return short
//     }


   // whichIsBetter



//}

function convertEpochToLocalTime(epoch) {
    const date = new Date(epoch)
    const formattedDate = date.toLocaleString()
    return formattedDate
}

