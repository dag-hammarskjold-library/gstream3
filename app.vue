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

      <DocumentTable v-else :documents="sortedDocuments" :headers="tableHeaders" :sort-key="sortKey"
          :sort-order="sortOrder" @sort="sortBy" />
  </div>
</template>
<script setup lang="ts">
import type { Document, TableHeader } from '~/types/document'
import dayjs from 'dayjs'
import type { LocationQueryRaw } from 'vue-router'

const route = useRoute()
const router = useRouter()

const dutyStations = ['Beirut', 'Geneva', 'Nairobi', 'New York', 'Vienna']
const { documents, loading, error, fetchDocuments } = useDocuments()

const date = defineModel('date')
const dutyStation = defineModel('dutyStation')
const query = route.query
date.value = query.date ? query.date : dayjs().subtract(1, 'day').format('YYYY-MM-DD')
dutyStation.value = query.dutyStation ? query.dutyStation : "New York"
fetchDocuments(date.value as string, dutyStation.value as string)

function updateFilters() {
  const filters = <LocationQueryRaw>{ 'date': date.value, 'dutyStation': dutyStation.value }
  router.push({ query: filters })
  fetchDocuments(date.value as string, dutyStation.value as string)
}

const sortKey = ref<keyof Document>('symbol1')
const sortOrder = ref<'asc' | 'desc'>('asc')

const tableHeaders: TableHeader[] = [
  { key: 'symbol1', label: 'Symbol 1' },
  { key: 'symbol2', label: 'Symbol 2' },
  { key: 'title', label: 'Title' },
  { key: 'files', label: 'Files' },
  { key: 'links', label: 'Links' }
]

const sortedDocuments = computed(() => {
  return [...documents.value].sort((a, b) => {
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

</script>