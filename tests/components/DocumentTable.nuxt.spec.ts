import { mountSuspended } from '@nuxt/test-utils/runtime'
import { it, expect } from 'vitest'
import { DocumentTable } from '#components'

it('can mount the document table component', async () => {
    const component = await mountSuspended(DocumentTable)
    expect(component.isVisible)
})