export type Alias = { name: string; fn: AliasFn }
export type AliasFn = (parts: string[]) => string | null
export type AliasMap = Map<string, AliasFn>

/**
 * Resolves a string of classes using aliases.
 */
export function lookup(map: AliasMap, classes: string): string {
	const sections = splitClasses(classes).map(className => {
		const style = findLongestAliasMatch(className, map, [])
		if (!style) return className

		return lookup(map, style)
	})

	return joinClassSections(sections)
}

/** Looks up an alias in an aliasMap and return it's result if it matches */
function findLongestAliasMatch(name: string, map: AliasMap, parts: string[]): string | null {
	// If the map has this plugin and it returns a style, resolve with the style
	if (map.has(name)) {
		const alias = map.get(name)!

		const style = alias(parts)
		if (style) return style
	}

	// Otherwise, keep looking
	const extraction = extractLastPart(name)
	if (!extraction) return null

	return findLongestAliasMatch(extraction.name, map, [extraction.part, ...parts])
}

function extractLastPart(name: string) {
	if (!name.includes('-')) return null

	const sections = name.split('-')
	const part = sections.pop()!
	const newName = sections.join('-')

	return { part, name: newName }
}

export interface AliasVariation {
	key: string | null
	style: string
	isDefault?: boolean
}
export interface AliasParams {
	base: string | null
	variations?: AliasVariation[][]
}

export function joinAliasMaps(maps: AliasMap[]) {
	const join: AliasMap = new Map()

	for (const map of maps) {
		for (const [name, fn] of map) join.set(name, fn)
	}

	return join
}

/**
 * Create an alias map.  Turns an array of aliases into an alias map.
 */
export function aliasMap(aliases: Alias[]): AliasMap {
	const map: AliasMap = new Map()

	for (const alias of aliases) map.set(alias.name, alias.fn)

	return map
}

/**
 * Creates an alias
 */
export function alias(name: string, params: AliasParams | string | AliasFn): Alias {
	if (typeof params === 'function') return { name, fn: params }

	const fn: AliasFn = parts => {
		// Get the parameter values
		const base = typeof params === 'string' ? params : params.base
		const variationGroups = typeof params === 'string' || !params.variations ? [] : params.variations

		// Create an array for the base sections (to be added to by the variations that match)
		const baseSections = base ? [base] : []

		// Loop through each variation
		for (const group of variationGroups) {
			// We need to remember if a variation was matched so that we can be sure not to match a variation from
			// the same group twice and can be sure to apply any group defaults if no variation matched
			let variationApplied: string | null = null
			let defaultVariationStyle: string | null = null

			// Check each variation of this group to see if any of them match
			for (const variation of group) {
				// First of all, while we are at the process of looping through variations, set the default variation
				if (variation.isDefault) defaultVariationStyle = variation.style

				// If the variation key is null, it is not meant to be consumed "publicly"
				if (!variation.key) continue

				// The variation key should match a "part"
				if (!parts.includes(variation.key)) continue

				// And because it did...
				// If a variation was already applied, warn and skip to the next variation
				if (variationApplied) {
					console.warn(
						`The variation "${variation.key}" of alias "${name}" was not matched because a variation from that same group, "${variationApplied}", already matched.`
					)
					continue
				}

				// Remember that it did
				variationApplied = variation.key
				// And add this variation's styles to the base sections
				baseSections.push(variation.style)
			}

			// If a variation was applied, skip to the next group
			if (variationApplied) continue

			// If this group does not have a default variation, skip to the next group
			if (!defaultVariationStyle) continue

			// Default style found!  Add it to the base sections
			baseSections.push(defaultVariationStyle)
		}

		return joinClassSections(baseSections)
	}

	return { name, fn }
}

function splitClasses(classes: string) {
	return classes.split(/ +/)
}

function joinClassSections(sections: string[]) {
	return sections.join(' ')
}
