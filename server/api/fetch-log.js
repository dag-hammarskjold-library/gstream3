import mongoose from 'mongoose'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol ? query.symbol : false
  const date = query.date ? query.date : dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const dutyStation = query.station ? query.station : "NY"
  try {
    let find_doc = {gdoc_date: date, gdoc_station: dutyStation, imported: true}
    if (symbol) {
      find_doc = {gdoc_date: date, gdoc_station: dutyStation, imported: true, symbols: symbol}
    }
    const entries = await GdocSchema.find(find_doc)
    let foundSymbols = []
    let symbolObjects = {}
    entries.forEach(e => {
      let symbol1 = e.symbols[0]
      let symbol2 = e.symbols[1]? e.symbols[1] : ""
      if (foundSymbols.includes(symbol1)) {
        // Add to an existing record
        symbolObjects[symbol1].files.push({
          embargo: "",
          languageId: e.languages.join(", "),
          odsNo: "",
          registrationDate: "",
          officialSubmissionDate: "",
          fileId: e.file_id
        })
      } else {
        symbolObjects[symbol1] = {
          _id: e._id,
          agendaNo: "",
          jobId: "",
          symbol1: symbol1,
          symbol2: symbol2,
          area: "",
          sessionNo: "",
          distributionType: "",
          title: "",
          files: [{
            embargo: "",
            languageId: e.languages.join(", "),
            odsNo: "",
            registrationDate: "",
            officialSubmissionDate: "",
            fileId: e.file_id
          }]
        }
        foundSymbols.push(symbol1)
      }
    })
    let returnData = []
    for (let k in symbolObjects) {
      returnData.push(symbolObjects[k])
    }
    
    return returnData
  }
  catch (error) {
    return error
  }
})
