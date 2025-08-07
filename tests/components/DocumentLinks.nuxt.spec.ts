import { mountSuspended } from '@nuxt/test-utils/runtime'
import { it, expect } from 'vitest'
import { DocumentLinks } from '#components'

it('can mount the document links component', async () => {
    const component = await mountSuspended(DocumentLinks)
    expect(component.isVisible)
})