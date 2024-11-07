const fs = require('fs');
const path = require('path');


// const dateObject = new Date();
// const day = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(dateObject.getDate()).padStart(2, '0')}`
const day = '2024-10-31'
const dirName = '/Users/scottike/SPX/' + day + '/data'

const symbol = 'SPXW  241031P05830000'

let spxSymbol
let spxLast
let spxQuoteTime
let putMap
let callMap

const startTime = "07:30:00"
const stopTime = "14:00:00"


function getFilesInDirectory(dirPath) {
    try {
        // Read directory contents
        const files = fs.readdirSync(dirPath);

        // Map files with full path and filter only regular files (not directories)
        const fileList = files
            .map(file => path.join(dirPath, file))
            .filter(file => fs.statSync(file).isFile())

        return fileList
    } catch (error) {
        console.error("Error reading directory:", error)
        return []
    }
}

function getOptionData(filename, id) {

    let data
    try {
        data = fs.readFileSync(filename, 'utf8');
        // console.log(data);
    } catch (err) {
        console.error(err);
    }

    if (data) {

        // Parse the JSON data
        const jsonData = JSON.parse(data)

        spxSymbol = jsonData.underlying.symbol
        spxLast = jsonData.underlying.last
        spxQuoteTime = jsonData.underlying.quoteTime

        putMap = jsonData.putExpDateMap[day + ':0']
        callMap = jsonData.callExpDateMap[day + ':0']

        const spxQuoteTimeDate = new Date(spxQuoteTime)
        const spXQuoteTimeString = getTimeString(spxQuoteTimeDate)

        if (compareTimeEalier(spXQuoteTimeString, startTime) || compareTimeLater(spXQuoteTimeString, stopTime)) {
            return
        }

        Object.keys(putMap).forEach(key => {
            const opt = putMap[key][0]
            if (symbol == opt.symbol) {
                 console.log(`${spXQuoteTimeString},${opt.bid.toFixed(2)}`);
            }
        })

        Object.keys(callMap).forEach(key => {
            const opt = callMap[key][0]
            if (symbol == opt.symbol) {
                console.log(`symbol: ${opt.description}\tlast: ${opt.last.toFixed(2)}\tbid: ${opt.bid.toFixed(2)}\task: ${opt.ask.toFixed(2)}`);
            }
        })

    }

}


function convertEpochToLocalTime(epoch) {
    const date = new Date(epoch)
    const formattedDate = date.toLocaleString()
    return formattedDate
}

function getTimeString(date) {
    const p = new Intl.DateTimeFormat('en', {
        hour:'2-digit',
        minute:'2-digit',
        second:'2-digit',
        hour12: false
    }).formatToParts(date).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    return `${p.hour}:${p.minute}:${p.second}`
}


function compareTimeEalier(time1, time2) {
    const parts1 = time1.split(':')
    const parts2 = time2.split(':')
    if (Number(parts1[0]) < Number(parts2[0])) {
        return true
    }
    if (Number(parts1[0]) == Number(parts2[0]) && Number(parts1[1]) < Number(parts2[1])) {
        return true
    }
    if (Number(parts1[0]) == Number(parts2[0]) && Number(parts1[1]) == Number(parts2[1]) && Number(parts1[2]) < Number(parts2[2])) {
        return true
    }
    return false
}

function compareTimeLater(time1, time2) {
    const parts1 = time1.split(':')
    const parts2 = time2.split(':')
    if (Number(parts1[0]) > Number(parts2[0])) {
        return true
    }
    if (Number(parts1[0]) == Number(parts2[0]) && Number(parts1[1]) > Number(parts2[1])) {
        return true
    }
    if (Number(parts1[0]) == Number(parts2[0]) && Number(parts1[1]) == Number(parts2[1]) && Number(parts1[2]) >  Number(parts2[2])) {
        return true
    }
    return false
}

console.log(symbol)

const files = getFilesInDirectory(dirName)
// console.log("Files in directory:", files)

files.forEach((file) => {
    getOptionData(file, symbol)
})

