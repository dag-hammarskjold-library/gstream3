<template>
    <div class="container mx-auto px-4 py-8">
        <div class="mb-8 space-y-4">
            <h1 class="text-2xl font-bold text-gray-900">gStream Documents List</h1>

            <div class="flex gap-4">
                <div class="w-64">
                    <label class="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" v-model="date"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        @input="updateFilters()" />
                </div>

                <div class="w-64">
                    <label class="block text-sm font-medium text-gray-700">Duty Station</label>
                    <select v-model="dutyStation"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        @change="updateFilters()">
                        <option v-for="station in dutyStations" :key="station" :value="station">
                            {{ station }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>

        <div v-else-if="error" class="bg-red-50 p-4 rounded-md">
            <p class="text-red-700">{{ error }}</p>
        </div>

        <DocumentTable
            v-if="!error"
            :documents="sortedDocuments"
            :headers="tableHeaders"
            :sort-key="sortKey"
            :sort-order="sortOrder"
            @sort="sortBy"
            :row-key="'_id'"
            :enrichment-errors="enrichmentErrors"
            :link-errors="linkErrors"
            :on-retry-enrichment="retryEnrichment"
            :on-retry-links="retryLinks"
        />
    </div>
</template>
<script setup lang="ts">

import { ref, computed, watch } from 'vue'
import type { Document, TableHeader } from '~/types/document'
import dayjs from 'dayjs'
import type { LocationQueryRaw } from 'vue-router'

const route = useRoute()
const router = useRouter()

const dutyStations = ['Beirut', 'Geneva', 'Nairobi', 'New York', 'Vienna']
const { documents, loading, error, fetchDocuments } = useDocuments()
const { fetchSymbol } = useSymbol()
const { fetchLinks } = useLinks() // Assume you have a composable for links

const date = defineModel('date')
const dutyStation = defineModel('dutyStation')
const query = route.query
date.value = query.date ? query.date : dayjs().subtract(1, 'day').format('YYYY-MM-DD')
dutyStation.value = query.dutyStation ? query.dutyStation : "New York"
fetchDocuments(date.value as string, dutyStation.value as string)

async function updateFilters() {
  const filters = <LocationQueryRaw>{ 'date': date.value, 'dutyStation': dutyStation.value }
  router.push({ query: filters })
  documents.value = []
  enrichedRows.value = {}
  linksRows.value = {}
  enrichmentErrors.value = {}
  linkErrors.value = {}
  await fetchDocuments(date.value as string, dutyStation.value as string)
}

const sortKey = ref<keyof Document>('symbol1')
const sortOrder = ref<'asc' | 'desc'>('asc')
console.log(sortKey.value, sortOrder.value)

const tableHeaders: TableHeader[] = [
  { key: 'symbol1', label: 'Symbol 1' },
  { key: 'symbol2', label: 'Symbol 2' },
  { key: 'title', label: 'Title' },
  { key: 'files', label: 'Files' },
  { key: 'links', label: 'Links' }
]

// Row-level enrichment and links
const enrichedRows = ref<Record<string, Partial<Document>>>({})
const linksRows = ref<Record<string, any>>({})
const enrichmentErrors = ref<Record<string, string>>({})
const linkErrors = ref<Record<string, string>>({})

// Watch for new documents and start enrichment/link fetching per row
watch(documents, (docs) => {
  docs.forEach(doc => {
    // Enrichment
    if (!enrichedRows.value[doc._id]) {
      loading.value = true
      fetchSymbol(date.value as string, dutyStation.value as string, doc.symbol1)
        .then(data => {
          enrichedRows.value[doc._id] = { ...data }
          delete enrichmentErrors.value[doc._id]
        })
        .catch(err => {
          enrichmentErrors.value[doc._id] = err?.message || 'Enrichment failed'
        }).finally( () => {
            loading.value = false
        })
    }
    // Links
    if (!linksRows.value[doc._id]) {
      fetchLinks(doc.symbol1)
        .then(data => {
          linksRows.value[doc._id] = data
          delete linkErrors.value[doc._id]
        })
        .catch(err => {
          linkErrors.value[doc._id] = err?.message || 'Links fetch failed'
        })
    }
  })
}, { immediate: true })

// Compose displayed documents from base, enrichment, and links
const displayedDocuments = computed(() => {
  return documents.value.map(doc => ({
    ...doc,
    ...(enrichedRows.value[doc._id] || {}),
    links: linksRows.value[doc._id] || []
  }))
})

const sortedDocuments = computed(() => {
  return [...displayedDocuments.value].sort((a, b) => {
    const aValue = a[sortKey.value]
    const bValue = b[sortKey.value]
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder.value === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    return sortOrder.value === 'asc'
      ? aValue > bValue ? 1 : -1
      : bValue > aValue ? 1 : -1
  })
})

function sortBy(key: keyof Document) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

// Retry handlers
async function retryEnrichment(_id: string) {
  const doc = documents.value.find(d => d._id === _id)
  if (!doc) return
  try {
    const symbolData = await fetchSymbol(
      date.value as string,
      dutyStation.value as string,
      doc.symbol1
    )
    enrichedRows.value[_id] = { ...symbolData }
    delete enrichmentErrors.value[_id]
  } catch (err: any) {
    enrichmentErrors.value[_id] = err?.message || 'Enrichment failed'
  }
}

async function retryLinks(_id: string) {
  const doc = documents.value.find(d => d._id === _id)
  if (!doc) return
  try {
    const linksData = await fetchLinks(doc.symbol1)
    linksRows.value[_id] = linksData
    delete linkErrors.value[_id]
  } catch (err: any) {
    linkErrors.value[_id] = err?.message || 'Links fetch failed'
  }
}

</script>