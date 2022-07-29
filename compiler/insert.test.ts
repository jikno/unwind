import { assertEquals } from 'https://deno.land/std@0.149.0/testing/asserts.ts'
import { insertUnwindImport } from './insert.ts'

Deno.test({
	name: '[insert] should insert import at top of script',
	fn() {
		const markup = `\
<script context="module">
	export const foo = 'bar'
</script>

<script>
	let name = 'World!'
</script>
`

		const expected = `\
<script context="module">
	export const foo = 'bar'
</script>

<script>
	import { unwind as __unwind } from 'path'
	let name = 'World!'
</script>
`

		assertEquals(insertUnwindImport(markup, '1.1.2', { path: 'path' }), expected)
	},
})

Deno.test({
	name: '[insert] should insert a script block when it cant find a script tag',
	fn() {
		const markup = `\
<div class="flex items-center">
	<img src="https://picsum.photos/500" />
</div>
`

		const expected = `\
<script lang="ts">
	import { unwind as __unwind } from 'path'
</script>

<div class="flex items-center">
	<img src="https://picsum.photos/500" />
</div>
`

		assertEquals(insertUnwindImport(markup, '1.1.1', { path: 'path' }), expected)
	},
})
