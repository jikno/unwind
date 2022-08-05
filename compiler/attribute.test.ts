import { assertEquals } from 'https://deno.land/std@0.149.0/testing/asserts.ts'
import { attributeToTemplateLiteral } from './attribute.ts'

function test(string: string, expect: { length: number; jsString: string }) {
	const result = attributeToTemplateLiteral(string)

	assertEquals(result.originalAttributeLength, expect.length)
	assertEquals(result.jsString, expect.jsString)
}

Deno.test({
	name: '[attribute] double quoted strings',
	fn() {
		test(`"Hello, World!" then there>`, {
			length: 15,
			jsString: '`Hello, World!`',
		})
	},
})

Deno.test({
	name: '[attribute] brackets inside double quoted strings should be ignored',
	fn() {
		test('"Hello, {name + ` ${lastName}`}!" then there>', {
			length: 33,
			jsString: '`Hello, ${name + ` ${lastName}`}!`',
		})
	},
})

Deno.test({
	name: '[attribute] double quotes in embedded js expressions should be ignored',
	fn() {
		test(`"Hello there!{""}">`, {
			length: 18,
			jsString: '`Hello there!${""}`',
		})
	},
})

Deno.test({
	name: '[attribute] backticks inside a quoted top level should be escaped',
	fn() {
		test('"Hello!  How about a backtick ` ehh?"', {
			length: 37,
			jsString: '`Hello!  How about a backtick \\` ehh?`',
		})
	},
})

Deno.test({
	name: '[attribute] newlines should work',
	fn() {
		test(
			`"
				Hi there!
			"/> this and that`,
			{
				length: 20,
				jsString: `\`
				Hi there!
			\``,
			}
		)
	},
})

Deno.test({
	name: '[attribute] embedded expressions should work',
	fn() {
		test(`{hello} man that />`, { length: 7, jsString: '`${hello}`' })
	},
})
