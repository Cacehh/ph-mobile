# ph-mobile

Validate, format and identify the network of Philippine mobile numbers. No dependencies.

```ts
import { parse } from 'ph-mobile';

const n = parse('0917 123 4567');
n.valid          // true
n.network        // 'globe'
n.local          // '0917 123 4567'
n.international  // '+639171234567'
```

`parse()` also reports in-between states (`incomplete`, `not_mobile`, `too_long`, `unknown_prefix`, `invalid_chars`) through `n.status`, so a form can give feedback while someone types. There are shortcuts too: `isValid`, `network`, `format`, `toE164`.

The network is the one that issued the prefix. Since mobile number portability, a number can move networks and keep its prefix.

The demo page lives in `demo/`.
