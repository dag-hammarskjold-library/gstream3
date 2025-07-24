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
            const response = await fetch(`/api/fetch-log?date=${date}&station=${station}`)
            const data = await response.json()
            documents.value = data
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
