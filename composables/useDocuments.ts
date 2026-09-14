import { ref, type Ref } from 'vue'
import type { Document } from '~/types/document'

export function useDocuments() {
    const documents: Ref<Document[]> = ref([])
    const loading = ref(false)
    const error = ref(null)
    let requestId = 0

    const fetchDocuments = async (date: string, dutyStation: string) => {
        const currentRequestId = ++requestId
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
            const logResponse = await fetch(`/api/fetch-log?date=${date}&station=${station}`)
            if (!logResponse.ok) throw new Error(`Log request failed: ${logResponse.status}`)
            const logData = await logResponse.json()
            if (currentRequestId !== requestId) return

            const documentsBySymbol = new Map<string, Document>(
                logData.map((document: Document): [string, Document] => [document.symbol1, document])
            )
            documents.value = Array.from(documentsBySymbol.values())
            loading.value = false

            fetch(`/api/fetch-symbols?date=${date}&dutyStation=${encodeURIComponent(dutyStation)}`)
                .then(async liveResponse => {
                    if (!liveResponse.ok) throw new Error(`Live symbol request failed: ${liveResponse.status}`)
                    return liveResponse.json()
                })
                .then((liveData: Document[]) => {
                    if (currentRequestId !== requestId) return

                    liveData.forEach((liveDocument: Document) => {
                        const existingDocument = documentsBySymbol.get(liveDocument.symbol1)
                        if (!existingDocument) {
                            documentsBySymbol.set(liveDocument.symbol1, {
                                ...liveDocument,
                                _id: `live-${liveDocument.symbol1}`,
                                historyUrl: `/api/fetch-history?station=${encodeURIComponent(station)}&symbol=${encodeURIComponent(liveDocument.symbol1)}`,
                                history: []
                            })
                            return
                        }

                        const existingFiles = new Set(existingDocument.files.map(file =>
                            file.fileId || `${file.languageId}:${file.odsNo}`
                        ))
                        const mergedFiles = [...existingDocument.files]
                        liveDocument.files.forEach(file => {
                            const fileKey = file.fileId || `${file.languageId}:${file.odsNo}`
                            if (!existingFiles.has(fileKey)) {
                                mergedFiles.push(file)
                                existingFiles.add(fileKey)
                            }
                        })

                        const existingMetadata = existingDocument as Document & Record<string, string | undefined>
                        const liveMetadata = liveDocument as Document & Record<string, string | undefined>
                        const mergedDocument = {
                            ...liveDocument,
                            ...existingDocument,
                            files: mergedFiles,
                            history: existingDocument.history || [],
                            historyUrl: existingDocument.historyUrl || liveDocument.historyUrl
                        } as Document & Record<string, string | undefined>
                        const metadataFields = ['agendaNo', 'jobId', 'symbol2', 'area', 'sessionNo', 'distributionType', 'title']
                        metadataFields.forEach(field => {
                            mergedDocument[field] = existingMetadata[field] || liveMetadata[field]
                        })
                        documentsBySymbol.set(liveDocument.symbol1, mergedDocument)
                    })

                    documents.value = Array.from(documentsBySymbol.values())
                })
                .catch(() => {
                    // The log-backed table is already available if the live export fails.
                })
        } catch (err: any) {
            if (currentRequestId !== requestId) return
            error.value = err.message
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
