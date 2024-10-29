// Import the 'fs' module to interact with the file system
const fs = require('fs')

// Read the JSON file asynchronously
fs.readFile('/Users/scottike/Downloads/f1.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading the file:", err)
        return
    }

    // Parse the JSON data
    const jsonData = JSON.parse(data)

    // Print specific data
    console.log(`Symbol: ${jsonData.underlying.symbol}`)
    console.log(`Last: ${jsonData.underlying.last}`)
    const putMap = jsonData.putExpDateMap['2024-10-18:0']

    Object.keys(putMap).forEach(key => {
        const opt = putMap[key][0]
        console.log(`symbol: ${opt.description}\tlast: ${opt.last.toFixed(2)}\tbid: ${opt.bid.toFixed(2)}\task: ${opt.ask.toFixed(2)}`);
    });


})

