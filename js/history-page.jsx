const { useState } = React;

function Paragraphs({ items }) {
  return items.map((item, index) => <p key={`${item}-${index}`}>{item}</p>);
}

function BulletList({ items }) {
  return <ul className="history-bullet-list">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>;
}

function toRoman(num) {
  const map = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
  ];
  let value = num;
  let result = "";
  for (const [arabic, roman] of map) {
    while (value >= arabic) {
      result += roman;
      value -= arabic;
    }
  }
  return result;
}

function ExpandablePanel({ openLabel, closeLabel, children, openClassName = "", closeClassName = "" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`history-expand-panel ${isOpen ? "is-open" : ""}`.trim()}>
      {!isOpen ? (
        <button type="button" className={`btn history-action-button history-action-button-open ${openClassName}`.trim()} onClick={() => setIsOpen(true)}>
          {openLabel}
        </button>
      ) : null}
      <div className="history-expand-body-shell">
        <div className="history-expand-body-inner">{children}</div>
      </div>
      {isOpen ? (
        <button type="button" className={`btn history-action-button history-action-button-close ${closeClassName}`.trim()} onClick={() => setIsOpen(false)}>
          {closeLabel}
        </button>
      ) : null}
    </div>
  );
}

function Subsection({ title, body = [], items = [] }) {
  return (
    <div className="history-subsection">
      <div className="history-subsection-title">{title}</div>
      <ExpandablePanel openLabel="РџРѕРґСЂРѕР±РЅРµРµ" closeLabel="РЎРєСЂС‹С‚СЊ РїРѕРґСЂРѕР±РЅРѕСЃС‚Рё">
        <div className="history-subsection-body">
          {body.length ? <Paragraphs items={body} /> : null}
          {items.length ? <BulletList items={items} /> : null}
        </div>
      </ExpandablePanel>
    </div>
  );
}

function SectionHead({ kicker, title, description }) {
  return (
    <div className="history-section-head">
      <div className="history-section-head-main">
        <div className="history-section-kicker">{kicker}</div>
        <h2 className="history-section-title">{title}</h2>
        {description ? <p className="history-section-description">{description}</p> : null}
      </div>
    </div>
  );
}


function HistoryCard({
  title,
  subtitle,
  kicker,
  intro = [],
  detailsTitle,
  details = [],
  totemTitle,
  totem = null,
  totemDetails = [],
  portrait = null,
  extraClass = "",
  openLabel = "РџРѕРґСЂРѕР±РЅРµРµ",
  closeLabel = "РЎРІРµСЂРЅСѓС‚СЊ РїРѕРґСЂРѕР±РЅРѕСЃС‚Рё"
}) {
  return (
    <article className={`placeholder-card history-card ${extraClass}`.trim()}>
      {kicker ? <div className="history-card-kicker">{kicker}</div> : null}
      <h3>{title}</h3>
      {subtitle ? <div className="history-card-subtitle">{subtitle}</div> : null}
      {intro.length ? <Paragraphs items={intro} /> : null}
      <ExpandablePanel openLabel={openLabel} closeLabel={closeLabel}>
        <div className="history-expand-body">
          {detailsTitle ? <h4>{detailsTitle}</h4> : null}
          {details.length ? <Paragraphs items={details} /> : null}
          {totemTitle ? <h4>{totemTitle}</h4> : null}
          {totem ? <div className="history-highlight">{totem}</div> : null}
          {totemDetails.length ? <Paragraphs items={totemDetails} /> : null}
          {portrait ? (
            typeof portrait === "string" && portrait.startsWith("/static/heroes/") ? (
              <figure className="history-portrait">
                <img className="history-portrait-image" src={portrait} alt={`РџРѕСЂС‚СЂРµС‚ ${title}`} loading="lazy" />
              </figure>
            ) : (
              <div className="history-portrait-note">{portrait}</div>
            )
          ) : null}
        </div>
      </ExpandablePanel>
    </article>
  );
}

function AnthemCard() {
  const anthemSections = [
    { title: "РљСѓРїР»РµС‚ 1", lines: [...historyAnthem[0].lines, ...historyAnthem[1].lines] },
    { title: "РџСЂРёРїРµРІ", lines: historyAnthem[2].lines },
    { title: "РљСѓРїР»РµС‚ 2", lines: [...historyAnthem[3].lines, ...historyAnthem[4].lines] },
    { title: "РџСЂРёРїРµРІ", lines: historyAnthem[5].lines }
  ];

  return (
    <article className="placeholder-card history-card history-anthem-card">
      <div className="history-card-kicker">Р“РёРјРЅ</div>
      <h3>РўРµРєСЃС‚ РіРёРјРЅР°</h3>
      <ExpandablePanel openLabel="РџРѕРєР°Р·Р°С‚СЊ С‚РµРєСЃС‚ РіРёРјРЅР°" closeLabel="РЎРІРµСЂРЅСѓС‚СЊ С‚РµРєСЃС‚ РіРёРјРЅР°">
        <div className="history-expand-body">
          {anthemSections.map((part, index) => (
            <section className="history-anthem-stanza" key={`${part.title}-${index}`}>
              <h4>{part.title}</h4>
              {part.lines.map((line, lineIndex) => <p key={`${part.title}-${index}-${lineIndex}`}>{line}</p>)}
            </section>
          ))}
        </div>
      </ExpandablePanel>
    </article>
  );
}

function HistoryPage() {
  return (
    <div className="section-page history-page">
      <section className="placeholder-hero history-hero">
        <h1>РСЃС‚РѕСЂРёСЏ Рё РєРѕРґРµРєСЃ</h1>
        <p>Р—РґРµСЃСЊ СЃРѕР±СЂР°РЅС‹ С…СЂРѕРЅРёРєРё РРјРїРµСЂРёРё: Р»РѕСЂ, Р°СЂС…РѕРЅС‚С‹, РєРѕРґРµРєСЃ, Р°СЂС‚РµС„Р°РєС‚С‹ Рё РіРёРјРЅ.</p>
      </section>

      <nav className="history-tabs" aria-label="РЇРєРѕСЂСЏ СЂР°Р·РґРµР»РѕРІ РёСЃС‚РѕСЂРёРё">
        {historyQuickLinks.map((item) => (
          <a className="history-tab" href={`#${item.id}`} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>

      <section className="history-section" id="lore">
        <SectionHead kicker="Р›РѕСЂ" title="Р­РїРѕС…Р° РћСЃРЅРѕРІР°РЅРёСЏ" description="РљСЂР°С‚РєРѕРµ РІРІРµРґРµРЅРёРµ Рё РёСЃС‚РѕСЂРёСЏ СЃРѕР·РґР°РЅРёСЏ РРјРїРµСЂРёРё." />
        <div className="history-grid history-grid-2">
          <article className="placeholder-card history-card history-lead-card">
            <div className="history-card-kicker">{historyLore.empire.kicker}</div>
            <h3>{historyLore.empire.title}</h3>
            <Paragraphs items={historyLore.empire.intro} />
            <ExpandablePanel openLabel="Р§РёС‚Р°С‚СЊ РїРѕР»РЅРѕСЃС‚СЊСЋ" closeLabel="РЎРІРµСЂРЅСѓС‚СЊ">
              <div className="history-expand-body">
                <Paragraphs items={historyLore.empire.full} />
              </div>
            </ExpandablePanel>
          </article>

          <article className="placeholder-card history-card history-founder-card">
            <div className="history-card-kicker">{historyLore.nocturne.kicker}</div>
            <h3>{historyLore.nocturne.title}</h3>
            <Paragraphs items={historyLore.nocturne.intro} />
            <ExpandablePanel openLabel="Р§РёС‚Р°С‚СЊ РїРѕР»РЅРѕСЃС‚СЊСЋ" closeLabel="РЎРІРµСЂРЅСѓС‚СЊ">
              <div className="history-expand-body">
                <Paragraphs items={historyLore.nocturne.full} />
              </div>
            </ExpandablePanel>
          </article>
        </div>
      </section>

      <section className="history-section" id="legions">
        <SectionHead kicker="12 Р›РµРіРёРѕРЅРѕРІ" title="РЎС‚СЂСѓРєС‚СѓСЂР° Р»РµРіРёРѕРЅРѕРІ" description="РЎРІРѕРґРєР° РїРѕ РґРІРµРЅР°РґС†Р°С‚Рё Р»РµРіРёРѕРЅР°Рј Рё РёС… РїРѕРєСЂРѕРІРёС‚РµР»СЏРј." />
        <div className="history-grid history-grid-3">
          {historyLegions.map((legion) => (
            <article className="placeholder-card history-card history-legion-card" key={legion.title}>
              <div className="history-card-kicker">Р›РµРіРёРѕРЅ</div>
              <h3>{legion.title}</h3>
              <div className="history-card-subtitle">{legion.subtitle}</div>
              <p>{legion.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="history-section" id="archons">
        <SectionHead kicker="РђСЂС…РѕРЅС‚С‹" title="Р“Р»Р°РІРЅС‹Рµ РїРµСЂСЃРѕРЅР°Р¶Рё" description="РљР°СЂС‚РѕС‡РєРё РіРµСЂРѕРµРІ, РёС… РѕРїРёСЃР°РЅРёРµ Рё С‚РѕС‚РµРјС‹." />
        <div className="history-grid history-grid-3">
          {historyArchons.map((archon) => (
            <HistoryCard
              key={archon.title}
              title={archon.title}
              subtitle={archon.subtitle}
              kicker="РђСЂС…РѕРЅС‚"
              intro={archon.intro}
              detailsTitle={archon.detailsTitle}
              details={archon.details}
              totemTitle={archon.totemTitle}
              totem={archon.totem}
              totemDetails={archon.totemDetails}
              portrait={archon.portrait}
              openLabel="РџРѕРґСЂРѕР±РЅРµРµ"
              closeLabel="РЎРІРµСЂРЅСѓС‚СЊ РїРѕРґСЂРѕР±РЅРѕСЃС‚Рё"
            />
          ))}
        </div>
      </section>

      <section className="history-section" id="codex">
        <SectionHead kicker="РљРѕРґРµРєСЃ" title="Р’РµР»РёРєРёРµ Р—Р°РІРµС‚С‹ РРјРїРµСЂРёРё" description="Р—Р°РєРѕРЅ, РєРѕС‚РѕСЂРѕРјСѓ РїРѕРґС‡РёРЅСЏСЋС‚СЃСЏ РІСЃРµ Р¶РёС‚РµР»Рё." />
        <article className="placeholder-card history-card history-codex-card">
          <ol className="history-codex-list">
            {historyCodexRules.map((rule, index) => (
              <li key={`${index}-${rule}`}>
                <span className="history-codex-index">{toRoman(index + 1)}</span>
                <span className="history-codex-text">{rule}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="history-section" id="artifacts">
        <SectionHead kicker="РђСЂС‚РµС„Р°РєС‚С‹" title="РҐР°РѕСЃРёРЅР°С‚РѕСЂ Рё РҐРµРєСЃС‚РµРє" description="РњРµС…Р°РЅРёР·РјС‹, РёР· РєРѕС‚РѕСЂС‹С… СЃРєР»Р°РґС‹РІР°РµС‚СЃСЏ СЌРЅРµСЂРіРёСЏ РРјРїРµСЂРёРё." />
        <div className="history-grid history-grid-2">
          {historyArtifacts.map((artifact) => (
            <article className="placeholder-card history-card history-artifact-card" key={artifact.id}>
              <div className="history-card-kicker">РђСЂС‚РµС„Р°РєС‚</div>
              <h3>{artifact.title}</h3>
              <Paragraphs items={artifact.intro} />
              <div className="history-subsections">
                {artifact.sections.map((section) => (
                  <Subsection key={`${artifact.id}-${section.title}`} title={section.title} body={section.body || []} items={section.items || []} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="history-section" id="anthem">
        <SectionHead kicker="Р“РёРјРЅ" title="Р“РёРјРЅ РРјРїРµСЂРёРё" description="РўРµРєСЃС‚ РіРёРјРЅР°, СЂР°Р·РґРµР»С‘РЅРЅС‹Р№ РЅР° РєСѓРїР»РµС‚С‹ Рё РїСЂРёРїРµРІС‹." />
        <AnthemCard />
      </section>
    </div>
  );
}

window.HistoryPage = HistoryPage;
