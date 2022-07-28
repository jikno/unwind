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

```
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

Unwind functions in two steps.  A compile step wraps the value of all class attributes in a call to `unwind`, and the runtime function, `unwind`, parses the class names it receives into css and writes that css to the document head using Twind.

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

Aliases are based on a system of variations, and groups of variations.

A variation is a particular set of styles that are applied based on a that follow the 

### Options

Just because unwind is not a configuration headache does not mean that it is not customizable.  `setupUnwind` takes a `Theme` as an optional parameter.  All the values are optional.  `colors`, `spacing`, and `screens` default to the tailwind defaults.

```ts
setupUnwind({
	colors // A 
})
```

TODO:
- readme
- (done) selling point: like tailwind except it unwinds you from the headaches of configuration that goes along with it
- docs
- repo
- aliases -> aliasMap
- (done) plugins -> aliases
