export type Alias = { name: string; fn: AliasFn }
export type AliasFn = (parts: string[]) => string
export type AliasMap = Map<string, AliasFn>

/**
 * Resolves a string of classes using aliases.
 */
export function lookup(map: AliasMap, classes: string): string {
	const sections = splitClasses(classes).map(className => {
		const match = findLongestAliasMatch(className, map, [])
		if (!match) return className

		return lookup(map, match.alias(match.parts))
	})

	return joinClassSections(sections)
}

function findLongestAliasMatch(name: string, map: AliasMap, parts: string[]): { alias: AliasFn; parts: string[] } | null {
	if (map.has(name)) return { alias: map.get(name)!, parts }

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
	key: string
	style: string
	isDefault?: boolean
}
export interface AliasParams {
	base: string
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
export function alias(name: string, params: AliasParams): Alias {
	const fn: AliasFn = parts => {
		const baseSections = [params.base]

		if (!params.variations) return baseSections.join(' ')

		for (const group of params.variations) {
			let variationApplied = false

			for (const variation of group) {
				if (!parts.includes(variation.key)) continue

				variationApplied = true
				baseSections.push(variation.style)
			}

			if (variationApplied) continue

			const defaultVariation = group.find(g => g.isDefault)
			if (!defaultVariation) continue

			baseSections.push(defaultVariation.style)
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
