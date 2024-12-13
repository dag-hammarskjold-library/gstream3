import { ref, type Ref } from 'vue'
import type { DocumentLink } from '~/types/document'

export function useLinks() {
    const links: Ref<DocumentLink[]> = ref([])
    const loading = ref(false)
    const error = ref(null)

    const fetchLinks= async (symbol: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await fetch(`/api/fetch-links?symbol=${symbol}`)
            const data = await response.json()
            links.value = data
        } catch (err: any) {
            error.value = err.message
        } finally {
            loading.value = false
        }
    }

    return {
        links,
        loading,
        error,
        fetchLinks
    }
}