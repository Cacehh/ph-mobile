import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, isValid, network, toE164, format, parse } from '../src/index.ts';

test('normalize handles the usual ways people type a number', () => {
  for (const input of ['09171234567', '9171234567', '639171234567', '+63 917 123 4567', '(0917) 123-4567', '0917.123.4567']) {
    assert.equal(normalize(input), '9171234567', input);
  }
});

test('normalize rejects things that are not PH mobile numbers', () => {
  for (const input of ['', 'abc', '0917123456', '091712345678', '0281234567', '+1 917 123 4567', '63-2-8123-4567']) {
    assert.equal(normalize(input), null, input);
  }
});

test('network by prefix', () => {
  assert.equal(network('09171234567'), 'globe');
  assert.equal(network('0817 123 4567'), 'globe');
  assert.equal(network('09191234567'), 'smart');
  assert.equal(network('09221234567'), 'smart'); // ex-Sun
  assert.equal(network('09911234567'), 'dito');
  assert.equal(network('08951234567'), 'dito');
  assert.equal(network('09241234567'), null); // left out on purpose
  assert.equal(network('09001234567'), null);
});

test('isValid needs a known prefix', () => {
  assert.equal(isValid('+639171234567'), true);
  assert.equal(isValid('09001234567'), false);
});

test('formatting', () => {
  assert.equal(toE164('0917 123 4567'), '+639171234567');
  assert.equal(format('+639171234567'), '0917 123 4567');
  assert.equal(format('nope'), null);
});

test('parse gives a status for every stage of typing', () => {
  const st = (v: string) => parse(v).status;
  assert.equal(st(''), 'empty');
  assert.equal(st('   '), 'empty');
  assert.equal(st('0'), 'incomplete');
  assert.equal(st('0917 12'), 'incomplete');
  assert.equal(st('+6'), 'incomplete');
  assert.equal(st('+63 917'), 'incomplete');
  assert.equal(st('02'), 'not_mobile');
  assert.equal(st('02 8123 4567'), 'not_mobile');
  assert.equal(st('0917 123 45678'), 'too_long');
  assert.equal(st('0917 abc'), 'invalid_chars');
  assert.equal(st('0900 123 4567'), 'unknown_prefix');
  assert.equal(st('0917 123 4567'), 'valid');
});

test('parse returns the clean formats', () => {
  const r = parse('+63 991 555 0123');
  assert.deepEqual(r, {
    status: 'valid', valid: true, digits: '09915550123', prefix: '0991',
    network: 'dito', local: '0991 555 0123', international: '+639915550123',
  });
  assert.equal(parse('0900 123 4567').local, '0900 123 4567');
  assert.equal(parse('0900 123 4567').network, null);
});

test('parse and isValid agree', () => {
  for (const v of ['09171234567', '+639191234567', '09001234567', '0281234567', '0917']) {
    assert.equal(parse(v).valid, isValid(v), v);
  }
});
