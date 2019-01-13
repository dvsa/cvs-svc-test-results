<a href="https://travis-ci.org/nfour/lutils">
  <img src="https://travis-ci.org/nfour/lutils.svg?branch=master" />
</a>
&nbsp;
<a href="https://david-dm.org/nfour/lutils" title="dependencies status"><img src="https://david-dm.org/nfour/lutils/status.svg"/></a>

# `lutils`

✓ _TypesSript documented_

- [merge](#merge) for deep merging of objects
- [clone](#clone) for deep cloning of objects & arrays
- [typeOf](#typeof) for consistant type checking


```ts
import { typeOf, merge, clone } from 'lutils'
```

- See: [**CHANGELOG.md**](./CHANGELOG.md)

--------------------------------

## merge

Merge objects together, traversing objects & arrays recursively

- `merge(subject, ...sources[])` => `subject`
- Default **depth**: `10`

```ts
import { merge } from 'lutils'

merge({ aa: { cc: 1 }, }, { aa: { cc: 2 } }, { bb: 3 })
=== { aa: { cc: 2 }, bb: 3 }
```

--------------------------------

Construct & configure your own `Merge` instance

- `new Merge(config).merge`
- See: [**config**](./src/merge/merge.ts#L31)

```ts
import { Merge } from 'lutils'

const merge = new Merge({ depth: Infinity }).merge

merge(megaDeep, ultraDeep)
```

--------------------------------

Merge, but with two common behaviours, whitelisting and blacklisting

- `merge.white(subject, ...sources[])` => `subject`
- `merge.black(subject, ...sources[])` => `subject`

```ts
import { merge } from 'lutils'

merge.white({ aa: { bb: 1, cc: 1 } }, { aa: { xx: 2, cc: 2 } })
=== { aa: { bb: 1, cc: 2 } }

merge.black({ aa: { bb: 1, cc: 1 } }, { aa: { xx: 2, cc: 2 } })
=== { aa: { bb: 1, cc: 1, xx: 2 } }
```

--------------------------------

## clone

Clones objects & arrays recursively

- `clone(subject)` => `clonedSubject`
- Default **depth**: `10`

```ts
import { clone } from 'lutils'

const cloned = clone({ my: { little: { foo: 'bar' } } })
```

- `new Clone(config).clone`
- See: [**config**](./src/clone/clone.ts#L12)

```ts
import { Clone } from 'lutils'

const clone = new Clone({ depth: Infinity }).clone

const cloned = clone({ my: { little: { foo: 'bar' } } })
```

--------------------------------

## typeOf

Gets the type of a value as a lowercase string. \
Like the built-in `typeof`, but works for all primitives.

- `typeOf(value)` => `string`

```ts
import { typeOf } from 'lutils'

typeOf(null)
=== 'null'

typeOf(NaN)
=== 'nan'

typeOf([])
=== 'array'
```

--------------------------------

Specific type checkers are also exported and attached to `typeOf` \
These checkers also supply typescript with type information, meaning
they can act a **type guards**.

- `isBoolean(value)` => `boolean`
- `is<type>(value)` => `boolean`
- See: [**ITypeOf**](./src/typeOf/typeOf.ts#L3)

```ts
import { typeOf, isBoolean, isString } from 'lutils'

typeOf.isNull(null)
=== true

isString(undefined)
=== false

typeOf.isString('')
=== true

isBoolean(false)
=== true

// Type guarding...

function blah (aa: number|string) {
  if (isString(aa)) {
    // string
    aa += '!!!!'
  } else {
    // number
    ++aa 
  }

  return aa
}
```