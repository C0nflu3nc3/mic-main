function Paragraphs({ items }) {
  return items.map((item, index) => <p key={`${item}-${index}`}>{item}</p>);
}

function BulletList({ items }) {
  return <ul className="history-bullet-list">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>;
}

function Subsection({ title, body = [], items = [] }) {
  return (
    <details className="history-subsection">
      <summary>{title}</summary>
      <div className="history-subsection-body">
        {body.length ? <Paragraphs items={body} /> : null}
        {items.length ? <BulletList items={items} /> : null}
      </div>
    </details>
  );
}

function SectionHead({ kicker, title, description }) {
  return (
    <div className="history-section-head">
      <div>
        <div className="history-section-kicker">{kicker}</div>
        <h2 className="history-section-title">{title}</h2>
      </div>
      {description ? <p className="history-section-description">{description}</p> : null}
    </div>
  );
}

function HistoryCard({ title, subtitle, kicker, intro = [], detailsTitle, details = [], totemTitle, totem = null, totemDetails = [], portrait = null, extraClass = "" }) {
  return (
    <article className={`placeholder-card history-card ${extraClass}`.trim()}>
      {kicker ? <div className="history-card-kicker">{kicker}</div> : null}
      <h3>{title}</h3>
      {subtitle ? <div className="history-card-subtitle">{subtitle}</div> : null}
      {intro.length ? <Paragraphs items={intro} /> : null}
      <details className="history-expand">
        <summary>Подробнее</summary>
        <div className="history-expand-body">
          {detailsTitle ? <h4>{detailsTitle}</h4> : null}
          {details.length ? <Paragraphs items={details} /> : null}
          {totemTitle ? <h4>{totemTitle}</h4> : null}
          {totem ? <div className="history-highlight">{totem}</div> : null}
          {totemDetails.length ? <Paragraphs items={totemDetails} /> : null}
          {portrait ? <div className="history-portrait-note">{portrait}</div> : null}
        </div>
      </details>
    </article>
  );
}

function AnthemCard() {
  return (
    <article className="placeholder-card history-card history-anthem-card">
      <div className="history-card-kicker">Гимн</div>
      <h3>Гимн Империи</h3>
      <details className="history-expand" open={false}>
        <summary>Показать текст гимна</summary>
        <div className="history-expand-body">
          {historyAnthem.map((part) => (
            <section className="history-anthem-stanza" key={part.title}>
              <h4>{part.title}</h4>
              {part.lines.map((line, index) => <p key={`${part.title}-${index}`}>{line}</p>)}
            </section>
          ))}
        </div>
      </details>
    </article>
  );
}

function HistoryPage() {
  return (
    <div className="section-page history-page">
      <section className="placeholder-hero history-hero">
        <h1>История и кодекс</h1>
        <p>Здесь собраны лор Империи, сведения об Архонтах, Кодекс, Хаосинатор, Хекстек и гимн в виде удобной энциклопедии.</p>
      </section>

      <nav className="history-tabs" aria-label="Быстрый переход по разделам истории">
        {historyQuickLinks.map((item) => (
          <a className="history-tab" href={`#${item.id}`} key={item.id}>{item.label}</a>
        ))}
      </nav>

      <section className="history-section" id="lore">
        <SectionHead kicker="Вступление" title="Лор Империи" description="Краткий путь от разрушенных миров к единой Империи." />
        <div className="history-grid history-grid-2">
          <article className="placeholder-card history-card history-lead-card">
            <div className="history-card-kicker">{historyLore.empire.kicker}</div>
            <h3>{historyLore.empire.title}</h3>
            <Paragraphs items={historyLore.empire.intro} />
            <details className="history-expand">
              <summary>Читать полностью</summary>
              <div className="history-expand-body">
                <Paragraphs items={historyLore.empire.full} />
              </div>
            </details>
          </article>

          <article className="placeholder-card history-card history-founder-card">
            <div className="history-card-kicker">{historyLore.nocturne.kicker}</div>
            <h3>{historyLore.nocturne.title}</h3>
            <Paragraphs items={historyLore.nocturne.intro} />
            <details className="history-expand">
              <summary>Читать полностью</summary>
              <div className="history-expand-body">
                <Paragraphs items={historyLore.nocturne.full} />
                <div className="history-portrait-note">{historyLore.nocturne.portrait}</div>
              </div>
            </details>
          </article>
        </div>
      </section>

      <section className="history-section" id="legions">
        <SectionHead kicker="Структура" title="12 Легионов" description="Каждый Легион имеет покровителя-основателя и собственную роль в Империи." />
        <div className="history-grid history-grid-3">
          {historyLegions.map((legion) => (
            <article className="placeholder-card history-card history-legion-card" key={legion.title}>
              <div className="history-card-kicker">Легион</div>
              <h3>{legion.title}</h3>
              <div className="history-card-subtitle">{legion.subtitle}</div>
              <p>{legion.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="history-section" id="archons">
        <SectionHead kicker="Персонажи" title="Архонты" description="Краткая карточка, подробности и тотем каждого ключевого Архонта." />
        <div className="history-grid history-grid-3">
          {historyArchons.map((archon) => (
            <HistoryCard
              key={archon.title}
              title={archon.title}
              subtitle={archon.subtitle}
              kicker="Архонт"
              intro={archon.intro}
              detailsTitle={archon.detailsTitle}
              details={archon.details}
              totemTitle={archon.totemTitle}
              totem={archon.totem}
              totemDetails={archon.totemDetails}
              portrait={archon.portrait}
            />
          ))}
        </div>
      </section>

      <section className="history-section" id="codex">
        <SectionHead kicker="Закон" title="Кодекс Империи" description="Свод правил, который держит Империю в порядке и равновесии." />
        <article className="placeholder-card history-card history-codex-card">
          <ol className="history-codex-list">
            {historyCodexRules.map((rule, index) => (
              <li key={`${index}-${rule}`}>
                <span className="history-codex-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="history-codex-text">{rule}</span>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="history-section" id="artifacts">
        <SectionHead kicker="Механизмы" title="Артефакты и системы" description="Два ключевых элемента Империи: сердце её конвергенции и источник энергии." />
        <div className="history-grid history-grid-2">
          {historyArtifacts.map((artifact) => (
            <article className="placeholder-card history-card history-artifact-card" key={artifact.id}>
              <div className="history-card-kicker">Артефакт</div>
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
        <SectionHead kicker="Музыка" title="Гимн Империи" description="Текст гимна удобно спрятан в отдельной карточке, чтобы не перегружать страницу." />
        <AnthemCard />
      </section>
    </div>
  );
}

window.HistoryPage = HistoryPage;
