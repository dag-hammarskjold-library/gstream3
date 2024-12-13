<template>
    <div>
        <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>

        <div v-else-if="error" class="bg-red-50 p-4 rounded-md">
            <p class="text-red-700">{{ error }}</p>
        </div>
        <div v-else>
            <p v-for="link in links">
                <a :href="link['url']" target="_blank">{{ link['name'] }}</a>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    symbol: string
}>()

const { links, loading, error, fetchLinks } = useLinks()

fetchLinks(props.symbol)

</script>