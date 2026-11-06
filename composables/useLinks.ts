import { ref } from 'vue'
import type { DocumentLink } from '~/types/document'

export function useLinks() {
    const loading = ref(false)
    const error = ref<string | null>(null)
    const apiBase = `${useRuntimeConfig().app.baseURL}api/`

    // Make fetchLinks return the data directly
    const fetchLinks = async (symbol: string): Promise<DocumentLink[]> => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch(`${apiBase}fetch-links?symbol=${symbol}`)
            if (!response.ok) {
                let message = `Error ${response.status}: ${response.statusText}`
                try {
                    const errorData = await response.json()
                    if (errorData?.message) message = errorData.message
                } catch {}
                error.value = message
                throw new Error(message)
            }
            const data = await response.json()
            //console.log(data)
            return Array.isArray(data) ? data : []
        } catch (err: any) {
            error.value = err?.message || 'Unknown error'
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        fetchLinks
    }
}
