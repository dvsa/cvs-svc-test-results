### `2.3.0` May 17th 2017

**Features**:
- [x] `new Merge.White().merge` will construct a `merge.white` instance
- [x] `new Merge.Black().merge` will construct a `merge.black` instance
- [x] Both are also exported as `{ MergeWhite, MergeBlack }`

### `2.1.1` May 12th 2017

**Breaking changes**:
- [x] No more seperate npm modules for each function, only `lutils`
- [x] `typeOf.Boolean` etc. are renamed to `isBoolean` and exported individually
- [x] `merge` api simplified to only `merge(subject, ...sources[])`
- [x] `clone` api simplified to only `clone(subject)`

**New features**:
- [x] Full rewrite in Typescript, providing intellisense
- [x] Performance increases:
		- `typeOf` performance improved by **~220%**!!!
		- `merge` performance improved by **~30%**!
		- `clone` performance on par.
- [x] `typeOf` functions can act as type guards in typescript & Flow 
- [x] `Merge` provides a constructor for configuration
- [x] `Clone` provides a constructor for configuration
- [x] `Merge` and `Clone` have added warnings:
		- When default `depth` is hit
		- When invalid parameters are supplied

-----------------------------

### `1.2.5` Jan 10th 2017
- Adding typings

### `1.2.0` August 7th 2016
- Version bumps

### `1.0.1` April 23rd 2016
- Tidy up
- Constrain versions

### `1.0.0`
- Rebuilt lutils, splitting each function off
	- `lutils-typeof`
	- `lutils-merge`
	- `lutils-clone`
	- `lutils` simply exposes all three
- Converted to ES5 from CoffeeScript
- Refactored API to be more flexible and consitant with similar utilities, such as underscore
	- `merge`, `merge.whtie`, `merge.black`
		- `merge(obj1, obj2, obj3, ...)`
		- `merge(obj1, obj2, obj3, ..., function() {})`
		- `merge([obj1, obj2, obj3, ...], options)`
	- `merge` now supports test functions for custom merging
	- `clone`
		- `clone(obj, options)`
	- `typeOf` reamins the same
	- See each modules readme for precise api

### `0.2.10`
- Fixed `depth` being compared one unit too low.

### `0.2.7`
- Fixed an `{}.__proto__` mutation bug. `clone` is now significantly faster.
