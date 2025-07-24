<template>
    <div>
        <div v-if="linkErrors" class="bg-red-50 p-4 rounded-md">
            <p class="text-red-700">{{ linkErrors }}</p>
        </div>
        <div v-else>
            <p v-for="link in links">
                <a :href="link['url']" target="_blank">{{ link['name'] }}</a>
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DocumentLink } from '~/types/document';
const props = defineProps<{
    symbol: string
    links: DocumentLink[]
    linkErrors?: Record<string, string>
}>()

//const { links, loading, error, fetchLinks } = useLinks()

//fetchLinks(props.symbol)

</script>