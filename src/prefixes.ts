// Original network for each 4-digit prefix (the "9xx" after the leading 0).
// Because of mobile number portability, a number may have moved to another
// network since it was issued, so treat this as "issued by", not "currently on".
//
// Sun Cellular and TNT prefixes are listed as Smart, which owns both brands.
// 0924 is left out on purpose: sources disagree on whether it is still Smart
// (ex-Sun) or has been reassigned.

export type Network = 'globe' | 'smart' | 'dito';

const globe = [
  '0817', '0904', '0905', '0906', '0915', '0916', '0917', '0926', '0927',
  '0935', '0936', '0937', '0945', '0954', '0955', '0956', '0965', '0966',
  '0967', '0975', '0976', '0977', '0978', '0979', '0995', '0996', '0997',
];

const smart = [
  '0813', '0907', '0908', '0909', '0910', '0911', '0912', '0913', '0914',
  '0918', '0919', '0920', '0921', '0922', '0923', '0925', '0928', '0929',
  '0930', '0931', '0932', '0933', '0934', '0938', '0939', '0940', '0941',
  '0942', '0943', '0944', '0946', '0947', '0948', '0949', '0950', '0951',
  '0961', '0963', '0968', '0969', '0970', '0973', '0974', '0981', '0989',
  '0998', '0999',
];

const dito = ['0895', '0896', '0897', '0898', '0991', '0992', '0993', '0994'];

export const PREFIXES: Readonly<Record<string, Network>> = Object.freeze({
  ...Object.fromEntries(globe.map((p) => [p, 'globe' as const])),
  ...Object.fromEntries(smart.map((p) => [p, 'smart' as const])),
  ...Object.fromEntries(dito.map((p) => [p, 'dito' as const])),
});
