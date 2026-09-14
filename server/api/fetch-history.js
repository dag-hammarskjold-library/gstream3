export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol ? query.symbol : false
  const dutyStation = query.station ? query.station : 'NY'
  const date = query.date ? query.date : null

  if (!symbol) {
    throw createError({ statusCode: 400, statusMessage: 'A symbol is required' })
  }

  try {
    const historyFilter = { gdoc_station: dutyStation, symbols: symbol }
    if (date) {
      historyFilter.gdoc_date = date
    }

    const historyEntries = await GdocSchema.find(historyFilter).sort({ time: -1, gdoc_date: -1, _id: -1 })
    const events = []
    const aggregatedEvents = new Map()

    historyEntries.forEach(entry => {
      const eventDate = entry.time?.toISOString?.() || entry.gdoc_date
      entry.symbols
        .filter(entrySymbol => entrySymbol === symbol)
        .forEach(entrySymbol => {
          if (entry.imported === true) {
            events.push({
              date: eventDate,
              info: 'OK',
              data: {
                symbol: entrySymbol,
                language: entry.languages.join(', ')
              }
            })
            return
          }

          const info = entry.message?.info || 'Unknown'
          const language = entry.message?.language || ''
          const key = `${info}\u0000${language}`
          const aggregatedEvent = aggregatedEvents.get(key)
          if (aggregatedEvent) {
            aggregatedEvent.dates.push(eventDate)
          } else {
            const newEvent = {
              date: eventDate,
              dates: [eventDate],
              info,
              data: {
                symbol: entrySymbol,
                language
              }
            }
            aggregatedEvents.set(key, newEvent)
            events.push(newEvent)
          }
        })
    })

    return events
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
