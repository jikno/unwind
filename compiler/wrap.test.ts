import { assertEquals } from 'https://deno.land/std@0.149.0/testing/asserts.ts'
import { wrapTemplateClasses } from './wrap.ts'

Deno.test({
	name: '[wrap] wrap class attributes in a function',
	fn() {
		const markup = `\
<script lang="ts">
	import { takeSelfie } from './svelte.help'

	export let name: string
	let imagePath: string | null = null

	async function getSelfie() {
		const path = await takeSelfie()
		imagePath = path
	}
</script>

<div safe-area class="h-fulls {''}">
	<div class="p-20 h-full flex flex-col items-stretch justify-center">
		<div>
			<h1 class="text-center text-3xl">Hello, {name}!</h1>

			<button class="text-btn">Do Something</button>

			<div class="h-20" />

			{#if imagePath}
				<div
					class="
						mx-auto w-200 h-200 rounded-full border-2
						border-red bg-center bg-cover bg-no-repeat
					"
					style="background-image: url('{imagePath}')"
				/>

				<div class="h-20" />

				<button class="btn btn-spacious w-full" on:click={() => (imagePath = null)}> Remove Selfie </button>
			{:else}
				<button class="btn w-full" on:click={getSelfie}>Take Selfie</button>
			{/if}
		</div>
	</div>
</div>
`
		const expectedOutput = `\
<script lang="ts">
	import { takeSelfie } from './svelte.help'

	export let name: string
	let imagePath: string | null = null

	async function getSelfie() {
		const path = await takeSelfie()
		imagePath = path
	}
</script>

<div safe-area class={someFn(\`h-fulls \${''}\`)}>
	<div class={someFn(\`p-20 h-full flex flex-col items-stretch justify-center\`)}>
		<div>
			<h1 class={someFn(\`text-center text-3xl\`)}>Hello, {name}!</h1>

			<button class={someFn(\`text-btn\`)}>Do Something</button>

			<div class={someFn(\`h-20\`)} />

			{#if imagePath}
				<div
					class={someFn(\`
						mx-auto w-200 h-200 rounded-full border-2
						border-red bg-center bg-cover bg-no-repeat
					\`)}
					style="background-image: url('{imagePath}')"
				/>

				<div class={someFn(\`h-20\`)} />

				<button class={someFn(\`btn btn-spacious w-full\`)} on:click={() => (imagePath = null)}> Remove Selfie </button>
			{:else}
				<button class={someFn(\`btn w-full\`)} on:click={getSelfie}>Take Selfie</button>
			{/if}
		</div>
	</div>
</div>
`

		const result = wrapTemplateClasses(markup, 'someFn')

		assertEquals(result, expectedOutput)
	},
})
