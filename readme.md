# Unwind

Elegant tailwind support for Svelte and other Htmlx-style templates via the Deno ecosystem.

Get all the benefits of tailwindcss (+ some :wink:) while at the same time, unwinding yourself from all the configuration headaches that go along with it.

## Another Tailwind Project??

This project is similar to both [Twind](https://twind.dev) and the official [Tailwind CSS](https://tailwindcss.com).  It is similar to Tailwindcss in that it has a compilation step, it is similar to Twind in that it evaluates classes at runtime.

It is the belief of the author that this is the best of both worlds.

### The Problem

In the official tailwindcss, all of the css is compiled up front.  While this is definitely a viable process, there are some things that could be improved.

Tailwindcss comes with a headache of configuration.  Three extra configs, an extra `app.css` file, and all the developer hours that go into wondering why it isn't integrating with all their other libraries and frameworks.  Additionally, Tailwindcss can *only* run in the NodeJS/npm ecosystem.

Compilers like Tailwindcss cannot understand complex runtime operations.  For example, the Tailwindcss compiler cannot effectively produce styles for an expression like this:

```html
<div class="h-{size} w-{size}">
```

And if a compiler were to be built for such a thing, a few such expressions like that would throw "small bundle size" out the back door because the compiler would have to interpret that as "ship all of the `h-*` and `w-*` classes to the client".

This, and a further reduced bundle size, is one of the advantages of evaluating css at runtime, and Twind does a very good job at doing it efficiently and effectively.  But even Twind could be better.

It can get very tiresome to wrap the value of every class in a `tw` call.  Very tiresome, and you can't use Emmet.  The code above becomes this:

```html
<div class={tw`h-${size} w-${size}`}>
```

That doesn't seem like such a missive deal for just one line, but over scores of elements in a component, multiplied by the hundreds to thousands of components in that project, multiplied by each time it is refactored, it can get very tiresome.

### The Solution

Unwind functions in two steps.  A compile step wraps the value of all class attributes in a call to `unwind`, and the runtime caller function, `unwind`, parses the class names it receives into css and writes that css to the document head using Twind.

The whole solution is simple, fast, and efficient.  This project integrates nicely into the Deno ecosystem, but since it is just plain ESM, it will run just about anywhere.

Additionally, Unwind supports a system of aliases - aliases which can be recursive and can be generated when they are needed.  Tailwindcss and Twind do not have support for any such feature.

## Runtime Usage

If your htmlx/Svelte files have already been processed by the compiler, the only thing left to do is initialize the plugin.  This must be done before any of the Unwind-processed template files are rendered.

```ts
import { setupUnwind } from 'https://code.jikno.com/unwind/mod.ts'

setupUnwind({
	// The following three configurations are conformant with the Tailwindcss api
	colors,  // See https://tailwindcss.com/docs/customizing-colors
	spacing, // See https://tailwindcss.com/docs/customizing-spacing
	screens, // See https://tailwindcss.com/docs/screens

	// Aliases.  See the "Creating Aliases" section below
	aliases,

	// Space to configure each of the core plugins.  Conforms to the Tailwindcss api
	tailwindConfiguration,
})
```

### Creating Aliases

Aliases in Unwind are a powerful tool.  Here is where you can really unwind your full potential :wink:

```ts
import { alias, aliasMap } from 'https://code.jikno.com/unwind/mod.ts'

const map = aliasMap([
	alias(...),
	alias(...),
	...
])
```

#### Section

First, however, let's get the term "section" sorted out.  A list of sections is the result of splitting a class name on the dashes.

```ts
"class-name".split("-") // sections are "class", and "name"
```

#### Matching

A simple alias is quite simple.  It has some styles that will substitute the name in a class list.

```ts
alias('alias-name', 'base-styles to-apply')

// the above code can also be written as...

alias('alias-name', {
	base: 'base-styles to-apply',
})
```

Each alias has a name, and a set of base styles that will be applied if that alias is matched.  A class that matches an alias' name will be matched to that alias.  If no matches are found, the last section of the class name is removed and stashed and an alias is looked up again.  This process is repeated until a match is found or until all sections have been removed.

```html
<!-- These classes all match the alias "alias-name" defined in the last example -->
<div class="alias-name alias-name-foo-bar alias-name-foo-bar-baz" />

<!-- And after the alias defined above is matched, the classes will resolve to the following -->
<div class="base-styles to-apply base-styles to-apply base-styles to-apply" />
```

#### Variations

Aliases, however, are not just simple matchers.  They include a functionality called variations.  A particular variation of an alias can be selected by adding extra sections to the end of the alias name.  These sections are stashed during the matching process, but are then passed back to the alias so that it can apply the correct variations.

Here is an example.  This alias is called `alias-name` and has three variations: `foo`, `bar`, and `baz`.

```ts
alias('alias-name', {
	base: 'base-styles to-apply',
	variations: [
		[{ key: 'foo', style: 'apply-foo' }],
		[{ key: 'bar', style: 'apply-bar' }],
		[{ key: 'baz', style: 'apply-baz' }],
	]
})
```

Given an input of these classes...

```html
<div class="alias-name alias-name-foo-bar alias-name-foo-bar-baz" />
```

... the alias would resolve:
- `alias-name` to the base styles of that alias: `base-styles to-apply`.
- `alias-name-foo-bar` would resolve to the base styles, plus the `foo` variation, plus the `bar` variation: `base-styles to-apply apply-foo apply-bar`
- `alias-name-foo-bar-baz` would resolve to the base styles, plus the `foo` variation, plus the `bar` variation, plus the `baz` variation: `base-styles to-apply apply-foo apply-bar apply-baz`

#### Variation Grouping and Defaults

In the above example, you may have been wondering why you must nest an array inside an array to define groups.  The answer is simple.  It is because variations are applied in groups.  Lets say you have want to ship the following css classes.

`btn`, `btn-primary`, `btn-spacious`, and `btn-primary-spacious`.

The `btn` class should be the default button, grey, and with a cozy amount of padding around it.  The `btn-primary` class should be the default button with a blue color.  The `btn-spacious` class should be the default button with extra padding inside it.  The `btn-primary-spacious` should be the default button with both a blur color and extra padding inside it.

This type of is tricky to pull off with variations in the way that we have explained so far.  For example, you don't want to apply the "cozy padding" if the variation matched was "spacious".  Css doesn't have an order in the class list, so it would be a hit-miss gamble with which type of padding would win if you applied both types of padding.  This is why we have groups and defaults.

The padding-related variations can be in group, and the color-related variations can be in a group.  Additionally, each of the groups can have a default variation.

```ts
alias('btn', {
	base: '...',
	variations: [
		// Color-related variations
		[
			{ key: 'gray', style: 'bg-gray', isDefault: true },
			{ key: 'primary', style: 'bg-primary' },
		],
		// Padding-related variations
		[
			{ key: 'cozy', style: 'p-2', isDefault: true },
			{ key: 'spacious', style: 'p-4' },
		]
	]
})
```

In this example, if the "primary" variation doesn't match, the "gray" one will because it is the default for that group.  Likewise, if the "spacious" variation does not match, the "cozy" one will.

If you do not want the default variation to be accessible in any way other than default, you can set the `key` to `null`.

```ts
[
	{ key: null, style: 'p-2', isDefault: true },
	{ key: 'spacious', style: 'p-4' },
]
```

#### Recursive Behavior

Aliases can reference each other, even in a recursive fashion.  If the exact same styles are applied twice, the match will not apply the style a second time and a warning will be written to the console.

```ts
// Aliases can reference each other
alias('foo', 'bar')
alias('bar', 'baz-foo')

// Even if the reference is recursive
alias('baz', {
	base: null, // and yes, an alias can have a null base :D
	variations: [
		[
			{ key: 'foo', style: 'baz-bar' },
			{ key: 'bar', style: 'wow-i-was-referenced-recursively' },
		]
	]
})
```

#### Complex Alias Matching

If you want full control over how variation matching is done, and possibly even use variations as parameters, you can do so.  Simply supply a function to `alias` instead of an object.  If the function returns `null`, the alias match will be canceled and the program will search for another match.

```ts
alias('size', sections => {
	const size = sections[0]
	if (!size) return null // don't match this alias

	return `w-${size} h-${size}`
})
```

## Compiler Usage

> Note: If you are using [Sab](https://github.com/jikno/sab), this compilation is done automatically.

Unwind works by inserting calls to the Unwind runtime throughout Htmlx/Svelte templates prior to those particular compilations.

The function inserted into the htmlx/Svelte is called a runtime caller function.  It calls the current unwind runtime initialized by the `setupUnwind` function.  This function does not have to be from the same version (or even codebase) as the rest of the runtime.

The runtime caller function lives in [runtime-caller.ts](./runtime-caller.ts).

> Note: All options are optional

```ts
import { insertUnwindHooks } from 'https://code.jikno.com/unwind/compiler/mod.ts'

const htmlxSvelteWithUnwindRuntimeHooks = insertUnwindHooks(htmlxSvelteCode, {
	// The version of Unwind to use.  Defaults to the version of the compiler.
	// Note: Does not have to be the same version as the version of Unwind that setupUnwind is imported from
	version: '1.2.3',

	// The name to import the unwind function as
	// Can be useful if you need to avoid a naming conflict
	nameAs: 'customName', // Defaults to "__unwind"

	// Do not automatically add lang="ts" to script tags automatically generated when adding imports to files
	// without a preexisting script tag
	noTsScripts: true

	// Used for modifying the runtime caller to use
	exportName, // Import an exported name other than unwind
	path // Use a different path for the installation of the runtime.  Note: If this path contains the text "VERSION", that text will be replaces with the value of the `version` option above.
})
```

## Contributing

Heck yeah!

```shell
git clone https://github.com/jikno/unwind
cd unwind
deno test --watch .
```
