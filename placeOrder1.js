// Import the 'fs' module to interact with the file system
const fs = require('fs')

const day = '2024-10-28'
const fileRoot = '/Users/scottike/SPX/'
const dataName = 'data'
const omeicName = 'omeic'
const transactionsName = 'transactions'
const recommendationsName = 'recommendations'
const positionsName = 'positions'


//  root /Users/scottike/SPX/
// dataDir /Users/scottike/SPX/data/<date>/
// omeicDir /Users/scottike/SPX/omeic/<date>/
// transactionsDir /Users/scottike/SPX/transactions/<date>/transactions.json
// positionsDir /Users/scottike/SPX/positions/<date>/positions.json

const positionsFile = fileRoot + positionsName + '/' + day + '/' + positionsName + '.json'
const transactitonsFile = fileRoot + transactionsName + '/' + day + '/' + transactionsName + '.json'
const omeicDir = fileRoot + omeicName + '/' + day + '/'
const omeicRecommendationsFile = omeicDir + recommendationsName + '.json'
const dataDir = fileRoot + positionsName + '/' + day + '/'



// Read the JSON array from a file
fs.readFile( omeicRecommendationsFile, 'utf8', (err, data) => {

    if (err) {
        console.error('Error reading file:', err)
        return;
    }

    try {

        const recommendation = JSON.parse(data)
        console.log(JSON.stringify(recommendation, null,2))

        fs.readFile( positionsFile, 'utf8', (errPos, dataPos) => {

            let positions
            if (errPos) {
                console.log('No Positions yet')
                positions = []
            } else {
                positions = JSON.parse(dataPos)
            }

            positions.push(recommendation)

            // Write the modified array to a new file
            const newData = JSON.stringify(positions, null, 2) // 2 spaces for pretty formatting
            fs.writeFile(positionsFile, newData, (errWrite) => {
                if (errWrite) {
                    console.error('Error writing file:', errWrite)
                    return
                }
                console.log('Order Filled')
            })

       })

    } catch (err) {
        console.error('Error parsing JSON:', err);
    }

})


function convertEpochToLocalTime(epoch) {
    const date = new Date(epoch)
    const formattedDate = date.toLocaleString()
    return formattedDate
}

