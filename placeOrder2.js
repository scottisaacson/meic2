// Import the 'fs' module to interact with the file system
const fs = require('fs')

const day = '2024-10-31'
const fileRoot = '/Users/scottike/SPX/'
const dataName = 'data'
const omeicName = 'omeic'
const transactionsName = 'transactions'
const recommendationsName = 'recommendations'
const recommendationName = 'recommendation'
const positionsName = 'positions'


const positionsFile = fileRoot + day + '/' + positionsName + '/' + positionsName + '.json'
const transactionsFile = fileRoot + day + '/' + transactionsName + '/' + transactionsName + '.json'
const omeicDir = fileRoot + day + '/' + omeicName + '/'
const omeicRecommendationFile = omeicDir + recommendationsName + '.json'



function placeOrder () {

    let recommendation
    try {
        const fileData = fs.readFileSync(omeicRecommendationFile, 'utf8')
        recommendation = JSON.parse(fileData)
    } catch (err) {
        console.error(err);
    }

    let positions
    try {
        const fileData = fs.readFileSync(positionsFile, 'utf8')
        positions = JSON.parse(fileData)
    } catch (err) {
        positions = []
    }

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


function convertEpochToLocalTime(epoch) {
    const date = new Date(epoch)
    const formattedDate = date.toLocaleString()
    return formattedDate
}

placeOrder()



