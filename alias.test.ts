import { assertEquals } from 'https://deno.land/std@0.150.0/testing/asserts.ts'
import { alias, aliasMap, lookup } from './alias.ts'

Deno.test({
	name: '[alias] should substitute classes',
	fn() {
		const map = aliasMap([alias('alias-name', 'base-styles to-apply')])

		const input = 'alias-name alias-name-foo-bar alias-name-foo-bar-baz'
		const output = 'base-styles to-apply base-styles to-apply base-styles to-apply'

		assertEquals(lookup(map, input), output)
	},
})

Deno.test({
	name: '[alias] should substitute classes with newlines',
	fn() {
		const map = aliasMap([alias('alias-name', 'base-styles to-apply')])

		const input = `
			alias-name
			alias-name-foo-bar alias-name-foo-bar-baz`
		const output = 'base-styles to-apply base-styles to-apply base-styles to-apply'

		assertEquals(lookup(map, input), output)
	},
})

Deno.test({
	name: '[alias] should apply variations',
	fn() {
		const map = aliasMap([
			alias('alias-name', {
				base: 'base-styles to-apply',
				variations: [
					[{ key: 'foo', style: 'apply-foo' }],
					[{ key: 'bar', style: 'apply-bar' }],
					[{ key: 'baz', style: 'apply-baz' }],
				],
			}),
		])

		const input = 'alias-name alias-name-foo-bar alias-name-foo-bar-baz'
		const output = 'base-styles to-apply base-styles to-apply apply-foo apply-bar base-styles to-apply apply-foo apply-bar apply-baz'

		assertEquals(lookup(map, input), output)
	},
})

Deno.test({
	name: '[alias] should respect variation groups and defaults',
	fn() {
		const map = aliasMap([
			alias('btn', {
				base: 'button-class',
				variations: [
					// Color-related variations
					[
						{ key: 'gray', style: 'bg-gray', isDefault: true },
						{ key: 'primary', style: 'bg-primary' },
					],
					// Padding-related variations
					[
						{ key: null, style: 'p-2', isDefault: true },
						{ key: 'spacious', style: 'p-4' },
					],
				],
			}),
		])

		const input = 'btn btn-gray btn-spacious btn-primary-spacious'
		const output = 'button-class bg-gray p-2 button-class bg-gray p-2 button-class bg-gray p-4 button-class bg-primary p-4'

		assertEquals(lookup(map, input), output)
	},
})

Deno.test({
	name: '[alias] recursive matching',
	fn() {
		const map = aliasMap([
			// Aliases can reference each other
			alias('foo', 'bar'),
			alias('bar', 'baz-foo'),

			// Even if the reference is recursive
			alias('baz', {
				base: null,
				variations: [
					[
						{ key: 'foo', style: 'baz-bar' },
						{ key: 'bar', style: 'wow-i-was-referenced-recursively' },
					],
				],
			}),
		])

		const input = 'foo'
		const output = 'wow-i-was-referenced-recursively'

		assertEquals(lookup(map, input), output)
	},
})

// TODO tests for warnings if the same styles are added more than once

Deno.test({
	name: '[alias] complex alias matching should be supported',
	fn() {
		const map = aliasMap([
			alias('size', sections => {
				const size = sections[0]
				if (!size) return null // don't match this alias

				return `w-${size} h-${size}`
			}),
		])

		const input = 'size-20'
		const output = 'w-20 h-20'

		assertEquals(lookup(map, input), output)
	},
})

Deno.test({
	name: '[alias] should cancel match and keep looking if complex alias returns null',
	fn() {
		const map = aliasMap([
			alias('sized-box', sections => {
				const size = sections[0]
				if (!size) return null

				return `box w-${size} h-${size}`
			}),
			alias('sized', {
				base: 'base-class',
				variations: [[{ key: 'box', style: 'box-class' }]],
			}),
		])

		const input = 'sized-box'
		const output = 'base-class box-class'

		assertEquals(lookup(map, input), output)
	},
})

Deno.test({
	name: '[alias] should not allow infinitely recursive resolutions',
	fn() {
		const map = aliasMap([alias('btn', 'btn')])

		const input = 'btn red'
		const output = 'btn red'

		assertEquals(lookup(map, input), output)
	},
})
