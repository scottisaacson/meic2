const fs = require('fs')

const fileRoot = '/Users/scottike/SPX/'
const omeicName = 'omeic'
const recommendationName = 'recommendation'

let recommendation

let day

let spxTime


function main () {

    const desiredDate = fs.readFileSync("/Users/scottike/SPX/.date", "utf-8")
    if (desiredDate === 'today') {
        const dateObject = new Date();
        day = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`
    } else {
        day = desiredDate
    }

    placeOrder()

}

main()


function placeOrder () {

    const omeicDir = fileRoot + day + '/' + omeicName + '/'
    const omeicRecommendationFile = omeicDir + recommendationName + '.json'

    try {
        const fileData = fs.readFileSync(omeicRecommendationFile, 'utf8')
        recommendation = JSON.parse(fileData)
    } catch (err) {
        console.log('nada')
        return
    }

    spxTime = recommendation.underlying.time
    const timeFormatted = spxTime.replace(/:/g, '-')

    const callOrderBodyFile = omeicDir + 'tosCallOrderBody' + '.json'
    const putOrderBodyFile = omeicDir + 'tosPutOrderBody' + '.json'
    const callOrderBodyTimeFile = omeicDir + 'tosCallOrderBody-' + timeFormatted + '.json'
    const putOrderBodyTimeFile = omeicDir + 'tosPutOrderBody-' + timeFormatted + '.json'

    const putOrderBody = buildPutSpreadOrderBody()
    const callOrderBody = buildCallSpreadOrderBody()

    const pobf_fd = fs.openSync(putOrderBodyFile, 'w')
    try {
        const content = JSON.stringify(putOrderBody, null, 2)
        fs.writeSync(pobf_fd, content)
    } catch (error) {
        console.error('ERROR: No Put Spread Order Body:', error)
    } finally {
        fs.closeSync(pobf_fd)
    }

    const cobf_fd = fs.openSync(callOrderBodyFile, 'w')
    try {
        const content = JSON.stringify(callOrderBody, null, 2)
        fs.writeSync(cobf_fd, content)
    } catch (error) {
        console.error('ERROR: No Call Spread Order Body:', error)
    } finally {
        fs.closeSync(cobf_fd)
    }

    const pobfTime_fd = fs.openSync(putOrderBodyTimeFile, 'w')
    try {
        const content = JSON.stringify(putOrderBody, null, 2)
        fs.writeSync(pobfTime_fd, content)
    } catch (error) {
        console.error('ERROR: No Put Spread Order Body:', error)
    } finally {
        fs.closeSync(pobfTime_fd)
    }

    const cobfTime_fd = fs.openSync(callOrderBodyTimeFile, 'w')
    try {
        const content = JSON.stringify(callOrderBody, null, 2)
        fs.writeSync(cobfTime_fd, content)
    } catch (error) {
        console.error('ERROR: No Call Spread Order Body:', error)
    } finally {
        fs.closeSync(cobfTime_fd)
    }
}


function buildPutSpreadOrderBody () {

    let limitPrice = Math.round(((Number(recommendation.putSpread.bid) - Number(recommendation.putSpread.ask)) - 0.05) * 10) / 10
    // limitPrice += 10.0
    let stopPrice = Math.round((Number(recommendation.ic.putShortStop) + 0.05) * 10) / 10
    // limitPrice += 10.0

    const putOrderBody =
        {
            orderStrategyType: "TRIGGER",
            orderType: "NET_CREDIT",
            price: limitPrice.toFixed(2),
            duration: "DAY",
            session: "NORMAL",
            orderLegCollection: [
                {
                    instruction: "SELL_TO_OPEN",
                    quantity: 1,
                    instrument: {
                        assetType: "OPTION",
                        symbol: recommendation.putSpread.shortID
                    }
                },
                {
                    instruction: "BUY_TO_OPEN",
                    quantity: 1,
                    instrument: {
                        assetType: "OPTION",
                        symbol: recommendation.putSpread.longID
                    }
                }
            ],
            childOrderStrategies: [
                {
                    orderType: "STOP",
                    session: "NORMAL",
                    stopPrice: stopPrice.toFixed(2),
                    duration: "DAY",
                    orderStrategyType: "TRIGGER",
                    orderLegCollection: [
                        {
                            instruction: "BUY_TO_CLOSE",
                            quantity: 1,
                            instrument: {
                                symbol: recommendation.putSpread.shortID,
                                assetType: "OPTION"
                            }
                        }
                    ],
                    childOrderStrategies: [
                        {
                            orderType: "MARKET",
                            session: "NORMAL",
                            duration: "DAY",
                            orderStrategyType: "SINGLE",
                            orderLegCollection: [
                                {
                                    instruction: "SELL_TO_CLOSE",
                                    quantity: 1,
                                    instrument: {
                                        symbol: recommendation.putSpread.longID,
                                        assetType: "OPTION"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }

    return putOrderBody

}

function buildCallSpreadOrderBody () {

    let limitPrice = Math.round(((Number(recommendation.callSpread.bid) - Number(recommendation.callSpread.ask)) - 0.05) * 10) / 10
    // limitPrice += 10.0
    let stopPrice = Math.round((Number(recommendation.ic.callShortStop) + 0.05) * 10) / 10
    // stopPrice += 10.0

    const callOrderBody =
        {
            orderStrategyType: "TRIGGER",
            orderType: "NET_CREDIT",
            price: limitPrice.toFixed(2),
            duration: "DAY",
            session: "NORMAL",
            orderLegCollection: [
                {
                    instruction: "SELL_TO_OPEN",
                    quantity: 1,
                    instrument: {
                        assetType: "OPTION",
                        symbol: recommendation.callSpread.shortID
                    }
                },
                {
                    instruction: "BUY_TO_OPEN",
                    quantity: 1,
                    instrument: {
                        assetType: "OPTION",
                        symbol: recommendation.callSpread.longID
                    }
                }
            ],
            childOrderStrategies: [
                {
                    orderType: "STOP",
                    session: "NORMAL",
                    stopPrice: stopPrice.toFixed(2),
                    duration: "DAY",
                    orderStrategyType: "TRIGGER",
                    orderLegCollection: [
                        {
                            instruction: "BUY_TO_CLOSE",
                            quantity: 1,
                            instrument: {
                                symbol: recommendation.callSpread.shortID,
                                assetType: "OPTION"
                            }
                        }
                    ],
                    childOrderStrategies: [
                        {
                            orderType: "MARKET",
                            session: "NORMAL",
                            duration: "DAY",
                            orderStrategyType: "SINGLE",
                            orderLegCollection: [
                                {
                                    instruction: "SELL_TO_CLOSE",
                                    quantity: 1,
                                    instrument: {
                                        symbol: recommendation.callSpread.longID,
                                        assetType: "OPTION"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }

    return callOrderBody

}

// function getTimeStringDash(date) {
//     const p = new Intl.DateTimeFormat('en', {
//         hour:'2-digit',
//         minute:'2-digit',
//         second:'2-digit',
//         hour12: false
//     }).formatToParts(date).reduce((acc, part) => {
//         acc[part.type] = part.value;
//         return acc;
//     }, {});
//
//     return `${p.hour}-${p.minute}-${p.second}`
// }





