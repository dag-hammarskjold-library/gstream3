import { defineMongooseModel } from '#nuxt/mongoose'

export const GdocSchema = defineMongooseModel({
  name: 'gdoc_log',
  schema: {
    imported: {
      type: Boolean
    },
    message: {
      type: Object
    },
    gdoc_station: {
      type: String
    },
    gdoc_date: {
      type: String
    },
    symbols: {
      type: Array
    },
    languages: {
      type: Array
    },
    file_id: {
      type: String
    }
  },
  options: {
    collection: 'gdoc_log'
  }
})
