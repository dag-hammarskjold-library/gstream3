import { ref, type Ref } from 'vue'
import type { Document } from '~/types/document'

export function useDocuments() {
    const documents: Ref<Document[]> = ref([])
    const loading = ref(false)
    const error = ref(null)

    const fetchDocuments = async (date: string, dutyStation: string) => {
        loading.value = true
        error.value = null

        // remap duty station
        let station = "NY"
        switch (dutyStation) {
            case "New York":
                station = "NY"
                break
            case "Geneva":
                station = "GE"
                break
            default:
                station = dutyStation
        }

        try {
            const [logResult, liveResult] = await Promise.allSettled([
                fetch(`/api/fetch-log?date=${date}&station=${station}`),
                fetch(`/api/fetch-symbols?date=${date}&dutyStation=${encodeURIComponent(dutyStation)}`)
            ])
            if (logResult.status === 'rejected') throw logResult.reason
            const logResponse = logResult.value
            const logData = await logResponse.json()
            const liveResponse = liveResult.status === 'fulfilled' ? liveResult.value : null
            const liveData = liveResponse?.ok ? await liveResponse.json() : []
            const documentsBySymbol = new Map(logData.map((document: Document) => [document.symbol1, document]))

            liveData.forEach((liveDocument: Document) => {
                const existingDocument = documentsBySymbol.get(liveDocument.symbol1)
                documentsBySymbol.set(liveDocument.symbol1, {
                    ...(existingDocument || {}),
                    ...liveDocument,
                    _id: existingDocument?._id || `live-${liveDocument.symbol1}`,
                    history: existingDocument?.history || []
                })
            })

            documents.value = Array.from(documentsBySymbol.values())
        } catch (err: any) {
            error.value = err.message
        } finally {
            loading.value = false
        }
    }

    return {
        documents,
        loading,
        error,
        fetchDocuments
    }
}
