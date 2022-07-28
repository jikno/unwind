import { attributeToTemplateLiteral } from './attribute.ts'

/**
 * Wraps the content of all markup classes in a function
 *
 * @param markup The markup content to search for class attributes in
 * @param fnName The name of the function that you want to wrap the class content in
 * @returns The markup with the modified class attribute values
 */
export function wrapTemplateClasses(markup: string, fnName: string) {
	let processed = ``
	let toProcess = markup

	// Loop runs as long as there are characters to process
	while (toProcess.length) {
		// Find the next class attribute value
		const nextValue = getNextValue(toProcess)

		// If there aren't any left, process everything
		// This will break the loop because the loop only runs as long as there are chars to process
		if (!nextValue) {
			processed += toProcess
			toProcess = ''
			continue
		}

		// But if the value we found didn't consume any characters, error out to prevent an
		// infinite loop.
		// Value searchers should always consume something
		if (!nextValue.index) throw new Error("Class attribute searcher didn't consume any characters.  It must be broken.")

		// Process the text before the attribute value
		processed += toProcess.slice(0, nextValue.index) // the text to the processed array
		toProcess = toProcess.slice(nextValue.index) // remove it from the to-process array

		// Add to the processed section our new rendition of the class attribute
		processed += `{${fnName}(${nextValue.jsString})}`
		// Then remove the old attribute value from the to-process array
		toProcess = toProcess.slice(nextValue.originalAttributeLength)
	}

	return processed
}

/**
 * Takes in a string of markup and returns the number of characters before the
 * next class attribute, the length of that class attribute value, and a modified
 * version of that class attribute value that is a valid jsString
 */
function getNextValue(markup: string) {
	// The assignment of the class attribute is fairly easy to detect...
	const regex = /class\s*=\s*/g

	// ... so that is what we will look for
	const match = regex.exec(markup)
	if (!match) return null

	// Once we have a match, we will get the location of the end of that match.
	// Presumably, this is where the class attribute value begins because it is where the
	// assignment of that attribute ends
	const valueLocation = match.index + match[0].length

	// Next, we need to get the length of that attribute value - thankfully, we have a util for this
	const { jsString, originalAttributeLength } = attributeToTemplateLiteral(markup.slice(valueLocation))

	return { index: valueLocation, originalAttributeLength, jsString }
}
