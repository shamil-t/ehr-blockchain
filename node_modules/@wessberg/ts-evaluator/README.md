<!-- SHADOW_SECTION_LOGO_START -->

<div><img alt="Logo" src="https://raw.githubusercontent.com/wessberg/ts-evaluator/master/documentation/asset/ts-evaluator-logo.png" height="120"   /></div>

<!-- SHADOW_SECTION_LOGO_END -->

<!-- SHADOW_SECTION_DESCRIPTION_SHORT_START -->

> An interpreter for Typescript that can evaluate an arbitrary Node within a Typescript AST

<!-- SHADOW_SECTION_DESCRIPTION_SHORT_END -->

<!-- SHADOW_SECTION_BADGES_START -->

<a href="https://npmcharts.com/compare/%40wessberg%2Fts-evaluator?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/%40wessberg%2Fts-evaluator.svg"    /></a>
<a href="https://www.npmjs.com/package/%40wessberg%2Fts-evaluator"><img alt="NPM version" src="https://badge.fury.io/js/%40wessberg%2Fts-evaluator.svg"    /></a>
<a href="https://david-dm.org/wessberg/ts-evaluator"><img alt="Dependencies" src="https://img.shields.io/david/wessberg%2Fts-evaluator.svg"    /></a>
<a href="https://github.com/wessberg/ts-evaluator/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/wessberg%2Fts-evaluator.svg"    /></a>
<a href="https://github.com/prettier/prettier"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg"    /></a>
<a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"    /></a>
<a href="https://www.patreon.com/bePatron?u=11315442"><img alt="Support on Patreon" src="https://img.shields.io/badge/patreon-donate-green.svg"    /></a>

<!-- SHADOW_SECTION_BADGES_END -->

<!-- SHADOW_SECTION_DESCRIPTION_LONG_START -->

## Description

<!-- SHADOW_SECTION_DESCRIPTION_LONG_END -->

This library is an implementation of an interpreter for Typescript that can evaluate any `Expression`, `ExpressionStatement` or `Declaration` within a Typescript AST.
Rather than interpreting a _program_, or a sequence of `Statement`s, this library takes a Node within an existing AST and evaluates it based on its' lexical environment.

This makes the library an effective companion if you're building a linter, framework, language service, partial evaluator, or something else where you may want to know the
computed value of a specific Node at any point in an AST.

One strength of this plugin is that it opens up entirely new use cases such as partial evaluation directly in the editor experience, for example to catch non-syntactic bugs that would
only occur on runtime, or more advanced diagnostic for frameworks.

To that end, several _policy_ options can be provided to configure restrictions in terms of what is allowed to be evaluated, such as IO and Network access.
Additionally, `ts-evaluator` supports both a Browser environment, a Node environment, and a pure ECMAScript environment. See [Setting up an environment](#setting-up-an-environment) for more details.

If you are looking for a Typescript REPL, or a way to _execute_ a full Typescript program, you're looking for something like [ts-node](https://github.com/TypeStrong/ts-node) instead.

<!-- SHADOW_SECTION_FEATURES_START -->

### Features

<!-- SHADOW_SECTION_FEATURES_END -->

- Evaluate _any_ Node within a Typescript AST and get an actual value back
- Supports browser-, node, and ECMA environments.
- Supports several reporting- and diagnostic hooks you can use use
- Is a full-featured JavaScript virtual machine
- Supports policy restrictions and sandboxing

<!-- SHADOW_SECTION_FEATURE_IMAGE_START -->

<!-- SHADOW_SECTION_FEATURE_IMAGE_END -->

<!-- SHADOW_SECTION_TOC_START -->

## Table of Contents

- [Description](#description)
  - [Features](#features)
- [Table of Contents](#table-of-contents)
- [Install](#install)
  - [npm](#npm)
  - [Yarn](#yarn)
  - [pnpm](#pnpm)
  - [Peer Dependencies](#peer-dependencies)
- [Usage](#usage)
  - [Setting up an environment](#setting-up-an-environment)
  - [Setting up Policies](#setting-up-policies)
  - [Custom TypeScript version](#custom-typescript-version)
  - [Logging](#logging)
  - [Reporting](#reporting)
- [Contributing](#contributing)
- [Maintainers](#maintainers)
- [Backers](#backers)
  - [Patreon](#patreon)
- [FAQ](#faq)
  - [How fast is this?](#how-fast-is-this)
- [License](#license)

<!-- SHADOW_SECTION_TOC_END -->

<!-- SHADOW_SECTION_INSTALL_START -->

## Install

### npm

```
$ npm install @wessberg/ts-evaluator
```

### Yarn

```
$ yarn add @wessberg/ts-evaluator
```

### pnpm

```
$ pnpm add @wessberg/ts-evaluator
```

### Peer Dependencies

`@wessberg/ts-evaluator` depends on `typescript`, so you need to manually install this as well.

<!-- SHADOW_SECTION_INSTALL_END -->

<!-- SHADOW_SECTION_USAGE_START -->

## Usage

<!-- SHADOW_SECTION_USAGE_END -->

Let's start off with a very basic example:

```typescript
import {evaluate} from "@wessberg/ts-evaluator";

const result = evaluate({
	node: someNode,
	typeChecker: someTypeChecker
});

// If a value was produced
if (result.success) {
	console.log(result.value);
}

// If an error occurred
else {
	console.log(result.reason);
}
```

In this example, the referenced bindings within the lexical environment of the Node will be discovered and evaluated before producing a final value. This means that
you don't have to evaluate the entire program to produce a value which may potentially be a much faster operation.

### Setting up an environment

You can define the kind of environment that `evaluate()` assumes when evaluating the given Node. By default, a `Node` environment is assumed.

The following environment presets are supported:

- `ECMA` - Assumes a pure ECMAScript environment. This means that no other globals than those that are defined in the ECMAScript spec such as `Math`, `Promise`, `Object`, etc, are available.
- `NODE` _(default)_ - Assumes a Node environment. This means that built-in modules such as `fs` and `path` can be resolved, and Node-specific globals such as `process` is present.
- `BROWSER` - Assumes a Browser environment. This means that DOM APIs are available and Browser-specific globals such as `window` is present.

Beyond presets, you can provide additional globals or override those that comes from the presets.
Here's how you can configure environment options:

```typescript
const result = evaluate({
	// ...
	environment: {
		// The "Node" environment is the default one. You can simply omit this key if you are targeting a Node environment
		preset: EnvironmentPresetKind.NODE,
		extra: {
			someGlobal: "someValue"
		}
	}
});
```

### Setting up Policies

With great power comes great responsibility. If you are embedding this plugin in, say, a language service plugin to enhance the editing experience in an editor,
you may want to apply some restrictions as to what can be evaluated.

By default, IO writes, network calls, and spawning child processes are restricted. You can customize this to your liking:

```typescript
const result = evaluate({
	// ...
	policy: {
		deterministic: false,
		network: false,
		console: false,
		maxOps: Infinity,
		maxOpDuration: Infinity,
		io: {
			read: true,
			write: false
		},
		process: {
			exit: false,
			spawnChild: false
		}
	}
});
```

Here's an explainer of the individual policies:

- `deterministic` _(default: `false`)_ - If `deterministic` is `true`, only code constructs that always evaluate to the same value is permitted. This means that things like `Math.random()` or `new Date()` without arguments, as well as network calls are restricted.
  This is useful if you are trying to statically analyze something and need to make sure that the value won't change for each invocation.

- `network` _(default: `false`)_ - If `network` is `true`, network activity is allowed, such as sending an HTTP request or hooking up a server.

- `console` _(default: `false`)_ - If `console` is `true`, logging to the console within evaluated code will produce the side-effect of actually logging to the console of the parent process. Usually, this is unwanted, since you're most likely only interested in the
  evaluated value, not so much the side-effects, but you can override this behavior by setting `console` to `true`.

- `maxOps` _(default: `Infinity`)_ - If `maxOps` is anything less than Infinity, evaluation will stop when the provided amount of operations has been performed. This is useful to opt-out of running CPU-intensive code, especially if you are embedding this library in an editor or a linter.

- `maxOpDuration` _(default: `Infinity`)_ - If `maxOpDuration` is anything less than Infinity, evaluation will stop when the provided amount of milliseconds have passed. This is useful to opt-out of long-running operations, especially if you are embedding this library in an editor or a linter.

- `io` _(default: `{read: true, write: false}`)_ - If `io` permits `READ` operations, files can be read from disk. If `io` permits `WRITE` operations, files can be written to disk.

- `process` _(default: `{exit: false, spawnChild: false}`)_ - If `process` permits `exit` operations, the evaluated code is permitted to exit the parent process. If `process` permits `spawnChild` operations, the evaluated code is permitted to spawn child processes.

### Custom TypeScript version

You can provide a specific version of TypeScript to use as an option to `evaluate`. This may come in handy if you're using
multiple TypeScript versions in your project or if you're receiving the TypeScript version to use as an argument from a third party.

```typescript
const result = evaluate({
	// ...
	typescript: someTypescriptModule
});
```

### Logging

You can get information about the evaluation process with various levels of logging. By default, nothing is logged, but you can override this behavior:

```typescript
const result = evaluate({
	// ...
	logLevel: LogLevelKind.DEBUG
});
```

Here's an explainer of the different log levels:

- `LogLevelKind.SILENT` _(default)_ - By default, nothing is logged to the console.
- `LogLevelKind.INFO` - Intermediate results are logged to the console.
- `LogLevelKind.VERBOSE` - Everything that is logged with `LogLevelKind.INFO` as well as lexical environment bindings are logged to the console
- `LogLevelKind.DEBUG` - Everything that is logged with `LogLevelKind.VERBOSE` as well as all visited Nodes during evaluation are logged to the console

### Reporting

You can tap into the evaluation process with reporting hooks that will be invoked with useful information while an evaluation is in progress.
These are useful if you want to understand more about the execution path and work with it programmatically.

```typescript
const result = evaluate({
	// ...
	reporting: {
		reportBindings: entry => doSomething(entry),
		reportTraversal: entry => someArray.push(entry.node),
		reportIntermediateResults: entry => doSomeOtherThing(entry),
		reportErrors: entry => doSomethingWithError(entry)
	}
});
```

Here's an explainer of the different reporting hooks:

- `reportBindings(entry: IBindingReportEntry) => void|(Promise<void>)` - Will be invoked for each time a value is bound to the lexical environment of a Node. This is useful to track mutations throughout code execution, for example to understand when and where variables are declared and/or mutated.
- `reportTraversal(entry: ITraversalReportEntry) => void|(Promise<void>)` - Will be invoked for each time a new Node is visited while evaluating. This is useful to track the path through the AST, for example to compute code coverage.
- `reportIntermediateResults(entry: IIntermediateResultReportEntry) => void|(Promise<void>)` - Will be invoked for each intermediate result that has been evaluated before producing a final result. This allows you to work programmatically with all expression values during code execution.
- `reportErrors(entry: IErrorReportEntry) => void|(Promise<void>)` - Will be invoked for each error that is thrown, both when evaluating a result, and for subsequent invocations on, for example, returned function instances. Holds a reference to the error, as well ast the AST node that threw or caused the Error.

<!-- SHADOW_SECTION_CONTRIBUTING_START -->

## Contributing

Do you want to contribute? Awesome! Please follow [these recommendations](./CONTRIBUTING.md).

<!-- SHADOW_SECTION_CONTRIBUTING_END -->

<!-- SHADOW_SECTION_MAINTAINERS_START -->

## Maintainers

| <a href="mailto:frederikwessberg@hotmail.com"><img alt="Frederik Wessberg" src="https://avatars2.githubusercontent.com/u/20454213?s=460&v=4" height="70"   /></a>                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Frederik Wessberg](mailto:frederikwessberg@hotmail.com)<br><strong>Twitter</strong>: [@FredWessberg](https://twitter.com/FredWessberg)<br><strong>Github</strong>: [@wessberg](https://github.com/wessberg)<br>_Lead Developer_ |

<!-- SHADOW_SECTION_MAINTAINERS_END -->

<!-- SHADOW_SECTION_BACKERS_START -->

## Backers

[Become a sponsor/backer](https://github.com/wessberg/ts-evaluator?sponsor=1) and get your logo listed here.

| <a href="https://usebubbles.com"><img alt="Bubbles" src="https://uploads-ssl.webflow.com/5d682047c28b217055606673/5e5360be16879c1d0dca6514_icon-thin-128x128%402x.png" height="70"   /></a> | <a href="https://github.com/cblanc"><img alt="Christopher Blanchard" src="https://avatars0.githubusercontent.com/u/2160685?s=400&v=4" height="70"   /></a> |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Bubbles](https://usebubbles.com)<br><strong>Twitter</strong>: [@use_bubbles](https://twitter.com/use_bubbles)                                                                              | [Christopher Blanchard](https://github.com/cblanc)                                                                                                         |

### Patreon

<a href="https://www.patreon.com/bePatron?u=11315442"><img alt="Patrons on Patreon" src="https://img.shields.io/endpoint.svg?url=https://shieldsio-patreon.herokuapp.com/wessberg"  width="200"  /></a>

<!-- SHADOW_SECTION_BACKERS_END -->

<!-- SHADOW_SECTION_FAQ_START -->

## FAQ

<!-- SHADOW_SECTION_FAQ_END -->

### How fast is this?

This is, after all, a virtual machine written on top of another virtual machine (V8), which is built in a dynamically typed high-level language (EcmaScript). This library is _not_ built to be
comparable in performance to raw V8 execution speed. However, since `ts-evaluator` doesn't require a compile-step and works directly on an AST, for small operations it will most likely be several magnitudes faster than
both `ts-node` and compiling to JavaScript with `tsc` and executing directly.

<!-- SHADOW_SECTION_LICENSE_START -->

## License

MIT © [Frederik Wessberg](mailto:frederikwessberg@hotmail.com) ([@FredWessberg](https://twitter.com/FredWessberg)) ([Website](https://github.com/wessberg))

<!-- SHADOW_SECTION_LICENSE_END -->
