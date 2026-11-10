import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { parse, type Network, type Parsed } from '../../src/index.ts';

const REPO = 'https://github.com/Cacehh/ph-mobile';
const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';
const EASE_IN = 'cubic-bezier(.4,0,1,1)';

const NET_NAME: Record<Network, string> = { globe: 'Globe', smart: 'Smart', dito: 'DITO' };
const NET_VAR: Record<Network, string> = { globe: 'var(--globe)', smart: 'var(--smart)', dito: 'var(--dito)' };

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

type Kind = 'empty' | 'partial' | 'bad' | 'valid';

function kindOf(p: Parsed): Kind {
  if (p.status === 'empty') return 'empty';
  if (p.status === 'incomplete') return 'partial';
  if (p.status === 'valid') return 'valid';
  return 'bad';
}

/* ---------- small motion helpers ---------- */

/** Swaps its content with a short fade-through whenever `swapKey` changes. */
function FadeSwap({ swapKey, children, as: Tag = 'span', ...rest }: {
  swapKey: string; children: ReactNode; as?: 'span' | 'b'; className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState({ key: swapKey, node: children });
  const anim = useRef<Animation | null>(null);

  useEffect(() => {
    if (swapKey === shown.key) {
      setShown((s) => (s.node === children ? s : { ...s, node: children }));
      return;
    }
    const el = ref.current;
    if (!el) return setShown({ key: swapKey, node: children });
    anim.current?.cancel();
    const r = reduceMotion();
    const out = el.animate(
      r ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-3px)' }],
      { duration: 70, easing: EASE_IN, fill: 'forwards' },
    );
    anim.current = out;
    out.onfinish = () => {
      setShown({ key: swapKey, node: children });
      out.cancel();
      anim.current = el.animate(
        r ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }],
        { duration: 140, easing: EASE_OUT },
      );
    };
  }, [swapKey, children]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Tag ref={ref as never} style={{ display: 'inline-block' }} {...rest}>{shown.node}</Tag>;
}

const ICON_COPY = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5v-2a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1h2" /></svg>
);
const ICON_OK = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
);
const ICON_WARN = (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="9" r="7.25" /><path d="M9 5.5v4.2M9 12.4v.1" /></svg>
);

/** Copy, then "Copied" for 1.6 s. Clicking again while copied only resets the timer. */
function CopyButton({ text, withIcon = true, ...rest }: { text: string; withIcon?: boolean; 'aria-label'?: string }) {
  const [done, setDone] = useState(false);
  const [labelDone, setLabelDone] = useState(false);
  const timer = useRef<number | null>(null);
  const lab = useRef<HTMLSpanElement>(null);

  // Label and tint swap together, with a fade-through.
  useEffect(() => {
    if (done === labelDone) return;
    const el = lab.current;
    if (!el) return setLabelDone(done);
    const r = reduceMotion();
    const out = el.animate(
      r ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px)' }],
      { duration: 80, easing: EASE_IN, fill: 'forwards' },
    );
    out.onfinish = () => {
      setLabelDone(done);
      out.cancel();
      el.animate(
        r ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }],
        { duration: 160, easing: EASE_OUT },
      );
    };
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onClick = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    if (timer.current) clearTimeout(timer.current);
    setDone(true);
    timer.current = window.setTimeout(() => { timer.current = null; setDone(false); }, 1600);
  };

  return (
    <button className={`copy${labelDone ? ' done' : ''}`} type="button" onClick={onClick} {...rest}>
      <span className="lab" ref={lab}>
        {withIcon && (labelDone ? ICON_OK : ICON_COPY)}
        {labelDone ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

/* ---------- result panels ---------- */

function badCopy(p: Parsed): { key: string; title: string; body: ReactNode } {
  switch (p.status) {
    case 'unknown_prefix':
      return {
        key: 'prefix' + p.prefix,
        title: `Unknown prefix ${p.prefix}`,
        body: <>No network is listed for it. If that looks wrong, <a href={`${REPO}/issues`}>report it</a>.</>,
      };
    case 'not_mobile':
      return { key: 'notmobile', title: 'Not a mobile number', body: <>PH mobile numbers start with <code>09</code> or <code>+639</code>.</> };
    case 'too_long':
      return { key: 'long' + p.digits.length, title: 'Too many digits', body: <>A PH mobile number has 11 digits. This one has {p.digits.length}.</> };
    default:
      return { key: 'chars', title: 'Only digits, spaces and + are allowed', body: <>Try <code>0917 123 4567</code> or <code>+639171234567</code>.</> };
  }
}

function PanelBody({ p }: { p: Parsed }) {
  const kind = kindOf(p);
  if (kind === 'empty') {
    return <div className="hint">Any format works: <code>0917 123 4567</code> <code>+63 917 123 4567</code> <code>639171234567</code></div>;
  }
  if (kind === 'partial') {
    const n = p.digits.length;
    return (
      <div className="progress">
        <div className="dots" aria-hidden="true">{Array.from({ length: 11 }, (_, i) => <span key={i} className={i < n ? 'f' : ''} />)}</div>
        <FadeSwap swapKey={String(n)} className="cnt">{n} of 11 digits</FadeSwap>
      </div>
    );
  }
  if (kind === 'bad') {
    const b = badCopy(p);
    return (
      <div className="bad panel">
        {ICON_WARN}
        <div>
          <FadeSwap as="b" swapKey={b.key + 't'}>{b.title}</FadeSwap>
          <FadeSwap swapKey={b.key + 'b'}>{b.body}</FadeSwap>
        </div>
      </div>
    );
  }
  const net = p.network!;
  return (
    <div className="card panel" style={{ ['--net' as string]: NET_VAR[net] }}>
      <div className="top">
        <div className="net">
          <span className="dot" />
          <FadeSwap swapKey={net}>{NET_NAME[net]}</FadeSwap>
          <FadeSwap as="span" swapKey={p.prefix!} className="pfx"><small>prefix {p.prefix}</small></FadeSwap>
        </div>
        <span className="badge">{ICON_OK}Valid</span>
      </div>
      <div className="row">
        <span className="k">Local</span>
        <FadeSwap swapKey={p.local!} className="v">{p.local}</FadeSwap>
        <CopyButton text={p.local!} />
      </div>
      <div className="row">
        <span className="k">International</span>
        <FadeSwap swapKey={p.international!} className="v">{p.international}</FadeSwap>
        <CopyButton text={p.international!} />
      </div>
    </div>
  );
}

interface Item { id: number; parsed: Parsed; leaving: boolean }

/**
 * When the kind of result changes, the old panel fades out (taken out of flow),
 * the new one fades in, and the container height glides between them.
 * Same kind: the panel stays and only the changed text swaps.
 */
function Result({ parsed }: { parsed: Parsed }) {
  const box = useRef<HTMLDivElement>(null);
  const lastHeight = useRef(0);
  const nextId = useRef(1);
  const glide = useRef<Animation | null>(null);
  const [items, setItems] = useState<Item[]>([{ id: 0, parsed, leaving: false }]);
  const current = items[items.length - 1];
  const kindChanged = kindOf(current.parsed) !== kindOf(parsed);

  // Sync state to the new input during render (React's recommended pattern for derived state).
  if (current.parsed !== parsed) {
    if (kindChanged) {
      // Fast typing: anything still leaving goes immediately so panels never stack.
      setItems([{ ...current, leaving: true }, { id: nextId.current++, parsed, leaving: false }]);
    } else {
      setItems((list) => list.map((it) => (it.id === current.id ? { ...it, parsed } : it)));
    }
  }

  useLayoutEffect(() => {
    const el = box.current!;
    const to = el.offsetHeight;
    const from = lastHeight.current;
    if (from && from !== to && items.some((i) => i.leaving) && !reduceMotion()) {
      glide.current?.cancel();
      glide.current = el.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 220, easing: EASE_OUT });
    }
    lastHeight.current = to;
  }, [items]);

  const remove = (id: number) => setItems((list) => list.filter((i) => i.id !== id));

  return (
    <div className="result" id="result" aria-live="polite" ref={box}>
      {items.map((it, idx) => (
        <Panel key={it.id} item={it} animateIn={idx > 0 || it.id > 0} onGone={() => remove(it.id)} />
      ))}
    </div>
  );
}

function Panel({ item, animateIn, onGone }: { item: Item; animateIn: boolean; onGone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!animateIn) return;
    const r = reduceMotion();
    const a = ref.current!.animate(
      r ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
      { duration: 200, delay: 60, easing: EASE_OUT, fill: 'backwards' },
    );
    return () => a.cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!item.leaving) return;
    const el = ref.current!;
    const r = reduceMotion();
    const a = el.animate(
      r ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px) scale(.995)' }],
      { duration: 110, easing: EASE_IN, fill: 'forwards' },
    );
    a.onfinish = onGone;
    return () => { a.onfinish = null; };
  }, [item.leaving]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      className="panel"
      aria-hidden={item.leaving || undefined}
      style={item.leaving ? { position: 'absolute', inset: '0 0 auto 0', pointerEvents: 'none' } : undefined}
    >
      <PanelBody p={item.parsed} />
    </div>
  );
}

/* ---------- page ---------- */

export function App() {
  const [value, setValue] = useState(() => new URLSearchParams(location.search).get('v') ?? '');
  const input = useRef<HTMLInputElement>(null);
  const parsed = useParsed(value);

  return (
    <div className="wrap">
      <header className="in" style={{ ['--i' as string]: 0 }}>
        <a className="mark" href="./"><i />ph-mobile</a>
        <a className="gh" href={REPO}>
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
          GitHub
        </a>
      </header>

      <main>
        <h1 className="in" style={{ ['--i' as string]: 1 }}>Check a Philippine mobile number</h1>
        <p className="lede in" style={{ ['--i' as string]: 2 }}>Validates the number, names the network, and gives you the clean formats.</p>

        <div className="in" style={{ ['--i' as string]: 3 }}>
          <label className="lbl" htmlFor="num">Mobile number</label>
          <div className="field">
            <input
              id="num" ref={input} type="tel" inputMode="tel" autoComplete="off" spellCheck={false}
              placeholder="0917 123 4567" aria-describedby="result"
              value={value} onChange={(e) => setValue(e.target.value)}
            />
            <button
              className={`clear${value ? ' on' : ''}`} type="button" aria-label="Clear" tabIndex={value ? 0 : -1}
              onClick={() => { setValue(''); input.current?.focus(); }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </div>
          <Result parsed={parsed} />
          <p className="note">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="8" cy="8" r="6.5" /><path d="M8 7.2v4M8 4.8v.1" strokeLinecap="round" /></svg>
            <span>The network is the one the prefix was issued to. Numbers can be moved to another network, so it may not be the current one.</span>
          </p>
        </div>

        <h2 className="in" style={{ ['--i' as string]: 4 }}>Install</h2>
        <div className="snip in" style={{ ['--i' as string]: 5 }}>
          <pre>
            <span className="p">$ </span>npm install ph-mobile{'\n\n'}
            <span className="c">import</span> {'{ parse }'} <span className="c">from</span> <span className="s">'ph-mobile'</span>{'\n\n'}
            <span className="c">const</span> n = parse(<span className="s">'0917 123 4567'</span>){'\n'}
            n.valid          <span className="c">// true</span>{'\n'}
            n.network        <span className="c">// 'globe'</span>{'\n'}
            n.local          <span className="c">// '0917 123 4567'</span>{'\n'}
            n.international  <span className="c">// '+639171234567'</span>
          </pre>
          <CopyButton text="npm install ph-mobile" withIcon={false} aria-label="Copy install command" />
        </div>
        <div className="links in" style={{ ['--i' as string]: 6 }}>
          <a href={REPO}>Source on GitHub</a>
          <a href={`${REPO}#readme`}>Docs</a>
          <a href={`${REPO}/issues`}>Report a wrong prefix</a>
        </div>
      </main>

      <footer className="in" style={{ ['--i' as string]: 7 }}>
        <span>MIT licence</span>
        <a href="https://github.com/Cacehh">Made by Cayce Dy</a>
      </footer>
    </div>
  );
}

/** Same input string gives the same object, so the result only re-renders on real changes. */
function useParsed(value: string): Parsed {
  const cache = useRef<{ v: string; p: Parsed } | null>(null);
  if (!cache.current || cache.current.v !== value) cache.current = { v: value, p: parse(value) };
  return cache.current.p;
}
