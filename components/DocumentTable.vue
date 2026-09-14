<template>
  <div class="bg-white shadow-md rounded-lg overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th v-for="header in headers" :key="header.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              @click="$emit('sort', header.key)">
            {{ header.label }}
            <span v-if="sortKey === header.key" class="ml-1">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="doc in documents" :key="doc._id">
          <td class="px-6 py-4 whitespace-wrap">
            <div>{{ doc.symbol1 }}</div>
            <details v-if="doc.historyUrl" class="mt-2 text-sm" @toggle="loadHistory(doc)">
              <summary class="cursor-pointer text-indigo-700">
                Log events<span v-if="historyById[doc._id]"> ({{ historyById[doc._id].length }})</span>
              </summary>
              <div v-if="historyLoading[doc._id]" class="mt-2 text-gray-500">Loading...</div>
              <div v-else-if="historyErrors[doc._id]" class="mt-2 text-red-600">
                {{ historyErrors[doc._id] }}
              </div>
              <ul class="mt-2 space-y-1 text-gray-600">
                <li v-for="(event, index) in historyById[doc._id] || []" :key="`${event.date}-${index}`">
                  <span class="font-medium">{{ event.dates?.join(', ') || event.date }}</span>:
                  <span v-if="event.info"> info={{ event.info }}</span>
                  <span v-else>{{ event.message }}</span>
                  <span v-if="event.data?.language"> language={{ event.data.language }}</span>
                  <pre v-if="event.data?.symbol" class="mt-1 rounded bg-gray-50 p-2 text-xs">{{ JSON.stringify({ symbol: event.data.symbol }, null, 2) }}</pre>
                </li>
              </ul>
            </details>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">{{ doc.symbol2 }}</td>
          <td class="px-6 py-4">{{ doc.title }}</td>
          <td class="px-6 py-4">
            <span v-for="(file, index) in doc.files" :key="file.fileId || `${doc.symbol1}-${index}`" class="inline-block mr-2">
              {{ file.languageId }}: {{ file.odsNo }}
            </span>
          </td>
          <td class="px-6 py-4">
            <!-- Links -->
            <span v-if="doc.links && doc.links.length">
              <DocumentLinks 
                :links="doc.links" 
                :symbol="doc.symbol1"
              />
            </span>
            <div v-if="linkErrors && linkErrors[doc._id]" class="text-red-600 text-xs mt-2">
              {{ linkErrors[doc._id] }}
              <button
                class="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded"
                @click="props.onRetryLinks && props.onRetryLinks(doc._id)"
              >
                Retry Links
              </button>
            </div>
            <!-- Enrichment errors -->
            <div v-if="enrichmentErrors && enrichmentErrors[doc._id]" class="text-red-600 text-xs mt-2">
              {{ enrichmentErrors[doc._id] }}
              <button
                class="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded"
                @click="props.onRetryEnrichment && props.onRetryEnrichment(doc._id)"
              >
                Retry Enrichment
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Document, DocumentEvent, TableHeader } from '~/types/document'

const historyById = ref<Record<string, DocumentEvent[]>>({})
const historyLoading = ref<Record<string, boolean>>({})
const historyErrors = ref<Record<string, string>>({})

const props = defineProps<{
  documents: Document[]
  headers: TableHeader[]
  sortKey: keyof Document
  sortOrder: 'asc' | 'desc'
  enrichmentErrors?: Record<string, string>
  linkErrors?: Record<string, string>
  onRetryEnrichment?: (_id: string) => void
  onRetryLinks?: (_id: string) => void
}>()

async function loadHistory(document: Document) {
  if (!document.historyUrl || historyById.value[document._id] || historyLoading.value[document._id]) return

  historyLoading.value[document._id] = true
  delete historyErrors.value[document._id]
  try {
    const response = await fetch(document.historyUrl)
    if (!response.ok) throw new Error(`History request failed: ${response.status}`)
    historyById.value[document._id] = await response.json()
  } catch (error: any) {
    historyErrors.value[document._id] = error?.message || 'History request failed'
  } finally {
    historyLoading.value[document._id] = false
  }
}

defineEmits<{
  (e: 'sort', key: keyof Document): void
}>()
</script>