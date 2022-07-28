import { setup as setupTwind, tw } from 'https://cdn.skypack.dev/twind'
import { lookup, AliasMap, joinAliasMaps } from './alias.ts'

// deno-lint-ignore no-explicit-any
export type TailwindThemeValue = any

export interface Theme {
	/** Configure which screen breakpoints to use */
	screens?: Record<string, string>
	/** Configure which colors to use */
	colors?: Record<string, Record<string | number, string> | string>
	/** Configure which spacing to use */
	spacing?: Record<string, string>
	/** Add aliases */
	aliases?: AliasMap | AliasMap[]
	/**
	 * Configure tailwind core plugins directly.
	 * Can potentially override any of the values above
	 */
	tailwindConfiguration?: Record<string, TailwindThemeValue>
}

/**
 * Called to initialize unwind.  This includes adding accessors onto the window
 * so that the `unwind` function can function properly.
 */
export function setupUnwind(theme: Theme) {
	// Initialize twind...
	setupTwind({
		theme: {
			screens: theme.screens,
			colors: theme.colors,
			spacing: theme.spacing,
			...(theme.tailwindConfiguration || {}),
		},
	})

	const map: AliasMap = theme.aliases ? (Array.isArray(theme.aliases) ? joinAliasMaps(theme.aliases) : theme.aliases) : new Map()

	// Put an unwind accessor on the window
	// deno-lint-ignore no-explicit-any
	;(globalThis.window as any)._unwind = (classes: string) => {
		const mappedClasses = lookup(map, classes)

		return tw(mappedClasses)
	}
}
