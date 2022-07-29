/**
 * Resolves unwind classes to their styles and writes those styles to the document head
 * Returns the name of the classes that are referenced in the document head.
 * Does not have to be from the same version of the project that does all of the configuration.
 *
 * Behind the scenes, this function just detects an already loaded instance of `unwind`, applied to
 * the window by the `setup` function.  The benefit of doing this is that this function does not
 * need to on the same version as the rest of unwind.
 */
export function unwind(classes: string) {
	// deno-lint-ignore no-explicit-any
	type Any = any

	const unwind = (globalThis.window as Any)._unwind
	if (!unwind) throw new Error('Unwind has not been configured.  You must call "setup" first before calling "unwind".')

	return unwind(classes)
}
