const fs = require('fs');

function monitor () {

    const desiredDate = fs.readFileSync("/Users/scottike/SPX/.date", "utf-8")
    if (desiredDate === 'today') {
        const dateObject = new Date();
        day = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`
    } else {
        day = desiredDate
    }

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

    let icLast
    positions.forEach((ic) => {
        icLast = ic
    })

    if (icLast) {

        console.log('Date: ' + day)
        console.log('Time: ' + icLast.underlying.time)

        console.log(icLast.putSpread.summary)
        console.log('\t' + icLast.putSpread.long + ' Long Ask = ' + icLast.putSpread.ask)
        console.log('\t' + icLast.putSpread.short + ' Short Bid = ' + icLast.putSpread.bid)
        console.log('\t' + icLast.putSpread.short + ' Short Stop = ' + icLast.ic.putShortStop)
        console.log('')

        console.log(icLast.callSpread.summary)
        console.log('\t' + icLast.callSpread.long + ' Long Ask = ' + icLast.callSpread.ask)
        console.log('\t' + icLast.callSpread.short + ' Short Bid = ' + icLast.callSpread.bid)
        console.log('\t' + icLast.callSpread.short + ' Short Stop = ' + icLast.ic.callShortStop)
    } else {
        console.log('nada')
    }

}



monitor()
