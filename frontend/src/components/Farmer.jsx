import { Item, Reveal, Stagger } from "@animations";
import { useLang } from "../i18n/index.jsx";

export default function Farmer({ guide }) {
  const { t, lang, num } = useLang();
  const g = guide?.[lang];

  return (
    <section className="section section--tint" id="farmer">
      <div className="container">
        <Reveal className="section__head">
          <h2>{t.farmer.title}</h2>
          <p>{t.farmer.sub}</p>
        </Reveal>
        {g && (
          <>
            <Reveal as="p" className="farmer__intro">{g.intro}</Reveal>
            <Stagger className="grid grid--3">
              {g.sections.map((s, i) => (
                <Item key={s.id} className="card step">
                  <span className="step__num">{num(i + 1)}</span>
                  <h3>{s.title}</h3>
                  <ul>{s.items.map((x) => <li key={x}>{x}</li>)}</ul>
                </Item>
              ))}
            </Stagger>
          </>
        )}
      </div>
    </section>
  );
}
