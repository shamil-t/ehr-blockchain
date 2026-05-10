## [0.0.27](https://github.com/wessberg/ts-evaluator/compare/v0.0.26...v0.0.27) (2020-10-20)


### Features

* add TypeScript 4.1 support ([f1d2e28](https://github.com/wessberg/ts-evaluator/commit/f1d2e283e164021150c693c037d26e8e5a928df9))



## [0.0.26](https://github.com/wessberg/ts-evaluator/compare/v0.0.25...v0.0.26) (2020-08-07)


### Features

* **logical assignment:** add support for Logical Assignments ([639bc5c](https://github.com/wessberg/ts-evaluator/commit/639bc5ce192de9b1d7d87ac525038af409d4a4b3))



## [0.0.25](https://github.com/wessberg/ts-evaluator/compare/v0.0.24...v0.0.25) (2020-03-01)


### Features

* add support for TypeScript v3.8. Add support for passing a specific TypeScript version to the evaluate function. Remove dependency on deasync. Return a Promise when evaluating an await-expression. Disallow evaluating async iterators with the synchronous variant of evaluate ([c19e1cc](https://github.com/wessberg/ts-evaluator/commit/c19e1cca6ba84c38bbb63f3c0a8db8f0722a2e63))



## [0.0.24](https://github.com/wessberg/ts-evaluator/compare/v0.0.23...v0.0.24) (2019-11-09)


### Features

* **optional chaining:** add support for optional chaining and nullish coalescing ([7a79b34](https://github.com/wessberg/ts-evaluator/commit/7a79b34e6dd098a87f98bfab64c707a640c55ade))



## [0.0.23](https://github.com/wessberg/ts-evaluator/compare/v0.0.22...v0.0.23) (2019-10-14)


### Features

* **deasync:** make the deasync module an optional dependency since not all environments support it ([814e2f8](https://github.com/wessberg/ts-evaluator/commit/814e2f857132b9ff356a15be0c41217eb5c27f64))



## [0.0.22](https://github.com/wessberg/ts-evaluator/compare/v0.0.21...v0.0.22) (2019-09-09)



## [0.0.21](https://github.com/wessberg/ts-evaluator/compare/v0.0.20...v0.0.21) (2019-05-29)



## [0.0.20](https://github.com/wessberg/ts-evaluator/compare/v0.0.19...v0.0.20) (2019-04-25)



## [0.0.19](https://github.com/wessberg/ts-evaluator/compare/v0.0.18...v0.0.19) (2019-03-06)


### Bug Fixes

* **bug:** fixes an issue with ArrayLiteralExpressions and iterables. ([41c6452](https://github.com/wessberg/ts-evaluator/commit/41c6452342b31f606ee5fb9c4c50c6bc2d867e76))



## [0.0.18](https://github.com/wessberg/ts-evaluator/compare/v0.0.17...v0.0.18) (2018-12-30)


### Features

* **reporting:** adds a new reporter: reportErrors. This is a reporting hook that will be invoked for each error that is thrown, both when evaluating a result, and for subsequent invocations on, for example, returned function instances. Holds a reference to the error, as well ast the AST node that threw or caused the Error ([a65e386](https://github.com/wessberg/ts-evaluator/commit/a65e3861a1659e80ffd46e9c2ed48dff756dfebc))



## [0.0.17](https://github.com/wessberg/ts-evaluator/compare/v0.0.16...v0.0.17) (2018-12-30)


### Bug Fixes

* **bug:** fixes an issue where constructor arguments with a [public|protected|private] modifier wouldn't be set on the class instance as instance properties. Fixes [#10](https://github.com/wessberg/ts-evaluator/issues/10) ([2e091c0](https://github.com/wessberg/ts-evaluator/commit/2e091c034c46832715a493c26dc0a320de8c9ff9))


### Features

* **error:** errors now point to the Node that caused or threw them. Errors caused by the evaluated code itself such as ThrowStatements will produce ThrownError objects that point to the original error as well as the Node that caused or threw it. Fixes [#8](https://github.com/wessberg/ts-evaluator/issues/8) ([134b8ef](https://github.com/wessberg/ts-evaluator/commit/134b8efc4ea5854695883150641ffabac413bd5c))



## [0.0.16](https://github.com/wessberg/ts-evaluator/compare/v0.0.15...v0.0.16) (2018-12-30)



## [0.0.15](https://github.com/wessberg/ts-evaluator/compare/v0.0.14...v0.0.15) (2018-12-30)



## [0.0.14](https://github.com/wessberg/ts-evaluator/compare/v0.0.13...v0.0.14) (2018-12-30)


### Bug Fixes

* **bug:** fixes an issue with evaluating a ClassMember such as a MethodDeclaration, PropertyDeclaration, or a GetAccessorDeclaration directly. Fixes [#7](https://github.com/wessberg/ts-evaluator/issues/7) ([ad8bc78](https://github.com/wessberg/ts-evaluator/commit/ad8bc78f585f13211329ba7345d9c5b2d3b9d201))



## [0.0.13](https://github.com/wessberg/ts-evaluator/compare/v0.0.12...v0.0.13) (2018-12-29)



## [0.0.12](https://github.com/wessberg/ts-evaluator/compare/v0.0.11...v0.0.12) (2018-12-29)



## [0.0.11](https://github.com/wessberg/ts-evaluator/compare/v0.0.10...v0.0.11) (2018-12-28)



## [0.0.10](https://github.com/wessberg/ts-evaluator/compare/v0.0.9...v0.0.10) (2018-12-28)



## [0.0.9](https://github.com/wessberg/ts-evaluator/compare/v0.0.8...v0.0.9) (2018-12-19)



## [0.0.8](https://github.com/wessberg/ts-evaluator/compare/v0.0.7...v0.0.8) (2018-12-18)



## [0.0.7](https://github.com/wessberg/ts-evaluator/compare/v0.0.6...v0.0.7) (2018-12-16)



## [0.0.6](https://github.com/wessberg/ts-evaluator/compare/v0.0.5...v0.0.6) (2018-12-16)



## [0.0.5](https://github.com/wessberg/ts-evaluator/compare/v0.0.4...v0.0.5) (2018-12-16)



## [0.0.4](https://github.com/wessberg/ts-evaluator/compare/v0.0.3...v0.0.4) (2018-12-16)



## [0.0.3](https://github.com/wessberg/ts-evaluator/compare/v0.0.2...v0.0.3) (2018-12-16)



## [0.0.2](https://github.com/wessberg/ts-evaluator/compare/v0.0.1...v0.0.2) (2018-12-16)



## 0.0.1 (2018-12-16)



