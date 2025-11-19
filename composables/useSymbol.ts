import { ref } from 'vue'
import type { Document } from '~/types/document'

export function useSymbol() {
    const loading = ref(false)
    const error = ref<string | null>(null)

    const fetchSymbol = async (date: string, dutyStation: string, symbol: string): Promise<Document | null> => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch(`/api/fetch-symbol?date=${date}&dutyStation=${dutyStation}&symbol=${symbol}`)
            if (!response.ok) {
                // Try to get error message from response, fallback to status text
                let message = `Error ${response.status}: ${response.statusText}`
                try {
                    const errorData = await response.json()
                    if (errorData?.message) message = errorData.message
                } catch {}
                error.value = message
                throw new Error(message)
            }
            const data = await response.json()
            return Array.isArray(data) ? data[0] : data
        } catch (err: any) {
            error.value = err?.message || 'Unknown error'
            throw err // propagate error to caller
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        fetchSymbol
    }
}
