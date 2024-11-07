// Import the 'fs' module to interact with the file system
const fs = require('fs')

// Read the JSON file asynchronously
fs.readFile('/Users/scottike/Downloads/mark.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading the file:", err)
        return
    }

    // Parse the JSON data
    const jsonData = JSON.parse(data)

    // Print specific data
    console.log(`Symbol: ${jsonData.underlying.symbol}`)
    console.log(`Last: ${jsonData.underlying.last}`)
    const putMap = jsonData.putExpDateMap['2024-11-04:0']

    Object.keys(putMap).forEach(key => {
        const opt = putMap[key][0]
        console.log(`put,${opt.strikePrice.toFixed(0)},${opt.bid.toFixed(2)},${opt.ask.toFixed(2)},${opt.last.toFixed(2)}`);
    });

    const callMap = jsonData.callExpDateMap['2024-11-04:0']

    Object.keys(callMap).forEach(key => {
        const opt = callMap[key][0]
        console.log(`call,${opt.strikePrice.toFixed(0)},${opt.bid.toFixed(2)},${opt.ask.toFixed(2)},${opt.last.toFixed(2)}`);
    });

})

