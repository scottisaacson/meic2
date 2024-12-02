const fs = require('fs')

let puts = []
let calls = []

let spxLast
let spxSymbol
let spxTime
let args

let data
let day

let DTE = process.env.DTE
let formattedTime


function main () {

    args = process.argv.slice(2)

    const fileContent = fs.readFileSync(args[0], "utf8")

    data = JSON.parse(fileContent)

    if (!data) {
        console.log('nada')
        return
    }

    // console.log(JSON.stringify(data, null, 2))

    prepData()


    console.log('Date: ' + day)
    console.log('Time: ' + formattedTime)
    console.log('SPX = ' + spxLast.toFixed(0))

    puts.forEach((put) => {
        if (put.ask >= 0.10 && put.bid > 0.0) {
            console.log('\t\t' + put.strikePrice.toFixed(0) + '\t' + put.bid.toFixed(2) + '\t' + put.ask.toFixed(2))
        }
    })
    console.log('------------------------------------')
    calls.forEach((call) => {
         if (call.ask >= 0.10 & call.bid > 0.0) {
             console.log(''+ call.bid.toFixed(2) + '\t' + call.ask.toFixed(2) + '\t' + call.strikePrice.toFixed(0) )
         }
    })



}


function prepData() {

    day = args[0].split('/')[4]

    const optionChainKey = day + ':' + DTE

    // find the tableau
    spxSymbol = data.underlying.symbol
    spxLast = data.underlying.last
    spxTime = data.underlying.quoteTime
    formattedTime = getTimeStringDash(new Date(spxTime))

    const putMap = data.putExpDateMap[optionChainKey]
    const callMap = data.callExpDateMap[optionChainKey]

    if (putMap) {
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
            if (optSummary.strikePrice < spxLast) {
                puts.push(optSummary)
            }
        })

        puts.sort((a, b) => Number(a.strikePrice) - Number(b.strikePrice))
    }

    if (callMap) {
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
            if (optSummary.strikePrice > spxLast) {
                calls.push(optSummary)
            }
        })

        calls.sort((a, b) => Number(a.strikePrice) - Number(b.strikePrice))
    }


}


main()

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
