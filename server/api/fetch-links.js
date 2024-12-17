import * as xml2js from 'xml2js'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    let returnData = []

    if (!query.symbol) {
        return returnData
    }

    const dlxApiUrl = 'https://metadata.un.org/editor/api/'

    console.log("Searching DLX for the English file belonging to", query.symbol)

    // Search the DLX REST API for the symbol
    const dlxSearchUrl = `${dlxApiUrl}marc/bibs/records?search=symbol:'${query.symbol}'`
    const dlxResponse = await fetch(dlxSearchUrl)
    const dlxJson = await dlxResponse.json()
    const dlxData = await dlxJson.data

    // Get the record if we find one
    try {
        if (dlxData.length == 1) {
            const recordResponse = await fetch(dlxData[0])
            const recordJson = await recordResponse.json()
            const recordFiles = await recordJson.data.files

            // And look through the files to display the English file if there is one
            recordFiles.forEach(rf => {
                if (rf.language == 'en') {
                    returnData.push({
                        "name": "DLX",
                        "url": `${rf.url}?action=open`
                    })
                }
            })

        }
    } catch (err) {
        console.log("Could not retrieve a DLX link. Maybe it wasn't imported?", query.symbol)
    }

    // Search UNDL via the search API
    console.log("Searching UNDL for the English file belonging to", query.symbol)
    const undlSearchUrl = `https://digitallibrary.un.org/search?p=191__a:${query.symbol}&ot=856&of=xm`
    const undlResponse = await fetch(undlSearchUrl)
    const undlData = await undlResponse.text()
    let undlJs = {}
    try {
        xml2js.parseString(undlData, function (err, result) {
            if (result.collection.record.length == 1) {
                undlJs = result.collection.record[0]
            }
        })
        const undlUrl = undlJs.datafield.filter(df => {
            const language = df.subfield.find(sf => sf.$.code == 'y' && sf._ == 'English')
            return language
        }).map(df => {
            const url = df.subfield.find(sf => sf.$.code == 'u')._
            return url
        })
        if (undlUrl && undlUrl.length == 1) {
            returnData.push({
                "name": "UNDL",
                "url": undlUrl[0]
            })
        }
    } catch (err) {
        console.log("Could not retrieve a UNDL link. Maybe it wasn't imported?", query.symbol)
    }

    return returnData
})