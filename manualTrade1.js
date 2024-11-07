const fs = require('fs');
const path = require('path');


// const dateObject = new Date();
// const day = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`

const day = '2024-11-06'


const dataDirName = '/Users/scottike/SPX/' + day + '/data'


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

    let icLast
    positions.forEach((ic) => {
        icLast = ic

    })

    console.log('Time: ' + icLast.ic.time)

    console.log(icLast.putSpread.summary)
    console.log('\t' + icLast.putSpread.long + ' Long Ask = ' + icLast.putSpread.ask)
    console.log('\t' + icLast.putSpread.short + ' Short Bid = ' + icLast.putSpread.bid)
    console.log('\t' + icLast.putSpread.short + ' Short Stop = ' + icLast.ic.putShortStop)
    console.log('')

    console.log(icLast.callSpread.summary)
    console.log('\t' + icLast.callSpread.long + ' Long Ask = ' + icLast.callSpread.ask)
    console.log('\t' + icLast.callSpread.short + ' Short Bid = ' + icLast.callSpread.bid)
    console.log('\t' + icLast.callSpread.short + ' Short Stop = ' + icLast.ic.callShortStop)

}



monitor()
