import { prepend } from 'https://deno.land/x/dtils@1.3.0/lib/array.ts'

export interface InsertUnwindImportOptions {
	/**
	 * If specified, the imported function will have this name.
	 * Otherwise, it will be `__unwind`.
	 */
	nameAs?: string

	/**
	 * The name of the exported function to import.  Defaults to `unwind`.
	 */
	exportName?: string

	/**
	 * The path to the location of the unwind runtime.  Defaults to https://code.jikno.com/unwind@VERSION/unwind.ts
	 * If this string contains the text "VERSION", it will be replaced by the `version` argument
	 */
	path?: string

	/**
	 * If true, lang="ts" attribute tags will not be added to
	 */
	disableTypescript?: boolean
}

export function insertUnwindImport(markup: string, version: string, options: InsertUnwindImportOptions = {}) {
	const lines = markup.split('\n')
	const startScriptRegex = /^<\s*script\s*(lang="ts"|lang="typescript")?\s*>$/i

	let insertedImport = false

	// Loop through each line of the component
	for (const index in lines) {
		const line = lines[index]

		// If this line does not look like a start script tag skip to the next line
		if (!startScriptRegex.test(line.trim())) continue

		// Looks like the start of a component script
		// Insert the import right after this line
		lines.splice(parseInt(index) + 1, 0, buildImport())
		insertedImport = true

		// then, get outta here.  We should only import once
		break
	}

	// If we couldn't find a good place to insert the import, insert an entire script tag
	// at the top of the document
	if (!insertedImport) prepend(lines, [buildScriptTag(), buildImport(), '</script>', ''])

	// If the start script was found, the import now be in the lines array
	return lines.join('\n')

	function buildScriptTag() {
		if (options.disableTypescript) return `<script>`

		return `<script lang="ts">`
	}

	function buildImport() {
		const path = options.path || 'https://code.jikno.com/unwind@VERSION/unwind.ts'
		const versionedPath = path.replace('VERSION', version)

		return `\timport { ${options.exportName || 'unwind'} as ${options.nameAs || '__unwind'} } from '${versionedPath}'`
	}
}
