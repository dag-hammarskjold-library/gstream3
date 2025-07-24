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
          <td class="px-6 py-4 whitespace-nowrap">{{ doc.symbol1 }}</td>
          <td class="px-6 py-4 whitespace-nowrap">{{ doc.symbol2 }}</td>
          <td class="px-6 py-4">{{ doc.title }}</td>
          <td class="px-6 py-4">
            <span v-for="file in doc.files" :key="file.file_id" class="inline-block mr-2">
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
import type { Document, TableHeader } from '~/types/document'

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

defineEmits<{
  (e: 'sort', key: keyof Document): void
}>()
</script>