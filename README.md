# ph-mobile

Validate, format and identify the network of Philippine mobile numbers. No dependencies.

```ts
import { isValid, network, format, toE164 } from 'ph-mobile';

isValid('0917 123 4567');  // true
network('+639191234567');  // 'smart'
format('639171234567');    // '0917 123 4567'
toE164('0917-123-4567');   // '+639171234567'
```

The network is the one that issued the prefix. Since mobile number portability, a number can move networks and keep its prefix.
