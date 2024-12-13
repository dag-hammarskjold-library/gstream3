import { ref, type Ref } from 'vue'
import type { Document } from '~/types/document'

export function useDocuments() {
    const documents: Ref<Document[]> = ref([])
    const loading = ref(false)
    const error = ref(null)

    const fetchDocuments = async (date: string, dutyStation: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch(`/api/fetch-symbols?date=${date}&dutyStation=${dutyStation}`)
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