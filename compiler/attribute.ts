export interface AttributeToTemplateLiteralResult {
	/** The length of the attribute that is to be replaced */
	originalAttributeLength: number
	/** The modified attribute content that is a valid JS template literal */
	jsString: string
}

/**
 * Takes a given chunk of code that is expected to start with an htmlx attribute and
 * modifies the part of the string that is an attribute so that the entire attribute is a JS string.
 * This includes really just boils down to adding a dollar sign before replacing top level expressions
 * and wrapping the whole thing in backticks
 *
 * ```
 * "Hello, {name}" -> `Hello, ${name}`
 * {value} -> `${value}`
 * {value && this || that} -> `${value && this || that}`
 * "{names.length} name{names.length === 1 ? '' : 's'}" -> `${names.length} name${names.length === 1 ? '' : 's'}`
 * ```
 */
export function attributeToTemplateLiteral(string: string): AttributeToTemplateLiteralResult {
	let escaped = false
	let backtickStringIsReadyForExpressionOpener = false

	type LevelDescription = 'double-quote-string' | 'single-quote-string' | 'backtick-string' | 'expression'
	type TopLevelStrategy = 'none' | 'quoted' | 'id'

	const levels: LevelDescription[] = []

	let jsString = ``
	let consumed = 0
	let topLevelStrategy: TopLevelStrategy

	// If the string starts with a double quote, this is a regular quoted attribute with a top level.
	if (string.startsWith('"')) {
		// Consume the quote and mark this attribute as having a quoted top level
		consumed++
		topLevelStrategy = 'quoted'

		// Then finally, add a backtick to our mapped text because we are converting this htmlx attribute to a template literal.
		jsString += '`'
	}

	// If the string starts with a {, this htmlx attribute is skipping the top level entirely and going straight to a js expression
	else if (string.startsWith('{')) {
		// Consume the opening bracket...
		consumed++
		// ... and notify future operations that we are in an expression
		levels.push('expression')

		// Add the start of a template literal string embed to our mapped text because the current method of handling pure
		// htmlx expressions is to wrap them in template literals
		jsString += '`${'

		// Then, mark this attribute as having no top level
		topLevelStrategy = 'none'
	}

	// If the string starts with plain text, this is a htmlx attribute that jumps straight into a single identifier expression
	// without any brackets.
	else {
		// Notify future operations that we are in an expression
		levels.push('expression')

		// Add the start of a template literal string embed to our mapped text because the current method of handling pure
		// expressions is to wrap them in template literals
		jsString += '`${'

		// Then mark this attribute as having an identifier only top level
		topLevelStrategy = 'id'
	}

	// Now we will loop through each char and change the levels accordingly
	// We will also continue to map our htmlx attribute to a js string, char by char
	for (const char of string.slice(consumed).split('')) {
		consumed++

		// If we are in the top level, look for ", `, and {
		if (!levels.length) {
			// If we encounter a quote, the top level is done.  Get outta here.
			// We don't need to map anything over because the closing backticks are handled after this loop
			if (char === '"') break

			// If we encounter a backtick in the top level, this could be problematic
			// See, we are wrapping the whole thing in backticks, so an extra backtick here would result in
			// and invalid js expression.
			// Therefore, we must escape the backtick
			if (char === '`') {
				jsString += '\\`'

				// Then skip to next iteration because we don't want to add anything else to the jsString this round
				continue
			}

			// But if we encounter a {, this is really important
			if (char === '{') {
				// First of all, it means that we are in an expression now
				levels.push('expression')

				// But more importantly, it is where we need to make a modification to our mapped js expression
				// To embed an expression inside a template literal, you must use ${
				// So instead of just adding a { to our mapped js expression, we will add ${.
				jsString += '${'

				// Then skip to the next iteration because we don't want to add anything else to the jsString
				continue
			}

			// But any other text in the top level should be mapped over char for char
			jsString += char

			// Skip to the next iteration of the loop
			continue
		}

		// Anything that is not in the top level of an htmlx attribute is valid js.  It should be mapped char for char
		jsString += char

		const currentLevel = levels[levels.length - 1]

		// We are not in the top level
		if (currentLevel === 'expression') {
			// If we are in the type of expression that only allows ids, get outta here if this char is not id-like
			if (topLevelStrategy === 'id') {
				if (!/[a-z0-9_$]/i.test(char)) {
					// But we have to remember one thing.  We have already consumed this invalid char at the top of the loop.
					// But because the char is invalid, we must tell the program to go back and actually not consume this char.
					consumed--

					// Then, as said before, get heck outta here
					levels.pop()
					break
				}
			}

			if (char === '{') levels.push('expression')
			if (char === '}') {
				// Ok, this one is important.  We are not in the top level now, but we could be about to move back into it.
				levels.pop()

				// If we are, we need to do a few things
				if (!levels.length) {
					// If this attribute doesn't have a top level, this is the end of the attribute.
					// Get outta here
					if (topLevelStrategy === 'none') break
				}
			}
			if (char === "'") levels.push('single-quote-string')
			if (char === '"') levels.push('double-quote-string')
			if (char === '`') levels.push('backtick-string')

			continue
		}

		// We are in some sort of string now
		// If we are escaped, ignore whatever char this is
		if (escaped) {
			escaped = false
			continue
		}

		// We are at a char in the string that is not escaped
		// If we encounter a backslash, turn escape mode on
		if (char === '\\') {
			escaped = !escaped
			continue
		}

		// Ok, so this char is not a backslash
		// If this is a double quoted string, watch for "
		if (currentLevel === 'double-quote-string') {
			if (char === '"') levels.pop()

			continue
		}

		// If this is a single quoted string, watch for '
		if (currentLevel === 'single-quote-string') {
			if (char === "'") levels.pop()

			continue
		}

		// If this is a backtick string, watch for `, $, and {
		if (currentLevel === 'backtick-string') {
			// If the last char in this backtick string was $, watch for {
			if (backtickStringIsReadyForExpressionOpener) {
				backtickStringIsReadyForExpressionOpener = false

				if (char === '{') {
					levels.push('expression')
					continue
				}
			}

			// If this is a $, prepare for an expression opener in the next char
			if (char === '$') backtickStringIsReadyForExpressionOpener = true

			// But if we have a `, close the backtick string
			if (char === '`') levels.pop()

			continue
		}
	}

	// Ok, now that we are done with the loop and we have consumed all that we would need to, we need to finish off the
	// JS template literal we have started.
	// But we don't want to any closing brace to the {expression} attributes.  That closing bracket was already added when the
	// expression finished
	if (topLevelStrategy === 'quoted' || topLevelStrategy === 'none') jsString += '`'
	else jsString += '}`'

	return { originalAttributeLength: consumed, jsString }
}
