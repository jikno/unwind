import { insertUnwindImport, InsertUnwindImportOptions } from './insert.ts'
import { wrapTemplateClasses } from './wrap.ts'

export interface ImplementUnwindOptions extends InsertUnwindImportOptions {
	/**
	 * The version of unwind that you want to use.
	 * Defaults to the current version of this compiler, but the versions don't have to be the same
	 */
	version: string
}

/**
 * Preprocesses htmlx/Svelte to include support for unwind.  This is done by wrapping
 * every class attribute in a call to the unwind runtime.
 */
export function implementUnwind(markup: string, options: ImplementUnwindOptions) {
	const version = extractVersion(import.meta.url) || 'master'
	const markupWithScript = insertUnwindImport(markup, version, options)

	return wrapTemplateClasses(markupWithScript, options.nameAs || '__unwind')
}

function extractVersion(url: string) {
	const [_, after] = url.split('@')
	if (!after) return null

	const [version] = after.split('/')

	if (!version.length) return null

	return version
}
