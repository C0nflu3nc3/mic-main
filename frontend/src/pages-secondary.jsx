import { useMemo, useState } from "react";
import { Hero, formatDate, formatDateTime, uploadedPath } from "./shared";

function getMissionKind(mission) {
  if (mission.is_contract) return "contract";
  if (mission.is_exclusive) return "exclusive";
  return "normal";
}

function syncMissionKindFields(form, missionKind) {
  if (!form) return;
  const isContract = missionKind === "contract";
  const rewardWrap = form.querySelector("[data-mission-reward-wrap]");
  const rewardInput = form.querySelector("[data-mission-reward-input]");
  const maxWrap = form.querySelector("[data-mission-max-wrap]");
  const maxInput = form.querySelector("[data-mission-max-input]");

  if (rewardWrap) rewardWrap.hidden = isContract;
  if (maxWrap) maxWrap.hidden = isContract;
  if (rewardInput) rewardInput.required = !isContract;
  if (maxInput) maxInput.required = !isContract;
}

function MissionEditBlock({ mission }) {
  const missionKind = getMissionKind(mission);
  return (
    <details className="news-edit-block news-edit-action is-collapsed">
      <summary className="news-edit-summary">Редактировать задание</summary>
      <div className="news-edit-body">
        <form method="POST" action="/missions/update" className="news-edit-form">
          <input type="hidden" name="mission_id" value={mission.id} />
          <div className="mb-3">
            <label className="form-label" htmlFor={`mission-edit-title-${mission.id}`}>Название задания</label>
            <input className="form-control" id={`mission-edit-title-${mission.id}`} name="title" type="text" defaultValue={mission.title} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor={`mission-edit-description-${mission.id}`}>Текст задания</label>
            <textarea className="form-control" id={`mission-edit-description-${mission.id}`} name="description" rows="5" defaultValue={mission.description} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor={`mission-edit-kind-${mission.id}`}>Тип</label>
            <select
              className="form-control"
              id={`mission-edit-kind-${mission.id}`}
              name="mission_kind"
              defaultValue={missionKind}
              onChange={(event) => syncMissionKindFields(event.currentTarget.form, event.currentTarget.value)}
            >
              <option value="normal">Обычное задание</option>
              <option value="exclusive">Эксклюзивное задание</option>
              <option value="contract">Контракт</option>
            </select>
          </div>
          <div className="mb-3" data-mission-reward-wrap hidden={mission.is_contract}>
            <label className="form-label" htmlFor={`mission-edit-reward-${mission.id}`}>Награда</label>
            <input className="form-control" id={`mission-edit-reward-${mission.id}`} data-mission-reward-input name="reward" type="number" min="1" step="1" defaultValue={mission.is_contract ? "" : mission.reward} required={!mission.is_contract} />
          </div>
          <div className="mb-3" data-mission-max-wrap hidden={mission.is_contract}>
            <label className="form-label" htmlFor={`mission-edit-max-accepted-${mission.id}`}>Лимит откликов</label>
            <input className="form-control" id={`mission-edit-max-accepted-${mission.id}`} data-mission-max-input name="max_accepted_count" type="number" min="1" step="1" defaultValue={mission.max_accepted_count || 3} required={!mission.is_contract} />
          </div>
          <button type="submit" className="btn btn-primary">Сохранить изменения</button>
        </form>
      </div>
    </details>
  );
}

export function MissionsPage({ is_admin = false, can_take_missions = false, current_team_mission_count = 0, missions = [] }) {
  return (
    <div className="section-page missions-page ceremonial-page">
      <Hero title="Доска заказов" description="Легион может взять до 3 заданий одновременно. Лимит откликов на задание задаётся администратором." />
      {is_admin ? (
        <section className="placeholder-card mission-form-card">
          <h3>Добавить задание</h3>
          <form method="POST" action="/missions/add">
            <div className="mb-3"><label className="form-label" htmlFor="mission-title">Название задания</label><input className="form-control" id="mission-title" name="title" type="text" required /></div>
            <div className="mb-3"><label className="form-label" htmlFor="mission-description">Текст задания</label><textarea className="form-control" id="mission-description" name="description" rows="5" required /></div>
            <div className="mb-3">
              <label className="form-label" htmlFor="mission-kind">Тип</label>
              <select className="form-control" id="mission-kind" name="mission_kind" defaultValue="normal" onChange={(event) => syncMissionKindFields(event.currentTarget.form, event.currentTarget.value)}>
                <option value="normal">Обычное задание</option>
                <option value="exclusive">Эксклюзивное задание</option>
                <option value="contract">Контракт</option>
              </select>
            </div>
            <div className="mb-3" data-mission-reward-wrap><label className="form-label" htmlFor="mission-reward">Награда</label><input className="form-control" id="mission-reward" data-mission-reward-input name="reward" type="number" min="1" step="1" required /></div>
            <div className="mb-3" data-mission-max-wrap><label className="form-label" htmlFor="mission-max-accepted">Лимит откликов</label><input className="form-control" id="mission-max-accepted" data-mission-max-input name="max_accepted_count" type="number" min="1" step="1" defaultValue="3" required /></div>
            <button type="submit" className="btn btn-primary">Опубликовать задание</button>
          </form>
        </section>
      ) : (
        <div className="mission-limit-note">{can_take_missions ? <>Активных заданий у Легиона: {current_team_mission_count} / 3</> : <>Журналисты могут только просматривать задания и не могут их принимать.</>}</div>
      )}
      <div className="news-list">
        {missions.map((mission) => (
          <article className={`placeholder-card mission-card${mission.is_contract ? " mission-card-contract" : ""}${mission.is_exclusive ? " mission-card-exclusive" : ""}`} key={mission.id}>
            <div className="news-meta"><span>{mission.author_name}</span><span>{formatDateTime(mission.created_at)}</span></div>
            <h3>{mission.title}</h3>
            <p className="news-content">{mission.description}</p>
            <div className="mission-info"><span>{mission.is_contract ? "Формат: контракт" : `Награда: ${mission.reward} GRZ + 10 влияния`}</span><span>{mission.is_contract ? `Откликнулось легионов: ${mission.accepted_count}` : `Откликнулось легионов: ${mission.accepted_count} / ${mission.max_accepted_count || 3}`}</span></div>
            {mission.is_contract ? <div className="mission-exclusive-note">{mission.awarded_team_name ? `Контракт ушёл легиону: ${mission.awarded_team_name}` : "Контракт: легионы откликаются со своей ценой, победителя выбирает администратор."}</div> : null}
            {mission.is_exclusive ? <div className="mission-exclusive-note">Эксклюзивное задание: после подтверждения всех откликнувшихся автоматически закроется.</div> : null}
            {mission.is_closed ? <div className="mission-status-note">Задание закрыто и больше недоступно.</div> : null}
            {mission.accepted_teams && mission.accepted_teams.length ? <div className="mission-teams">Приняли задание: {mission.accepted_teams.join(", ")}</div> : null}
            {is_admin ? (
              <div className="mission-actions mission-admin-actions"><MissionEditBlock mission={mission} /><form method="POST" action="/missions/delete" onSubmit={(event) => { if (!window.confirm("Вы уверены?")) { event.preventDefault(); } }}><input type="hidden" name="mission_id" value={mission.id} /><button type="submit" className="btn btn-outline-light">Удалить миссию</button></form></div>
            ) : can_take_missions ? (
              mission.is_closed ? (
                <button type="button" className="btn btn-secondary" disabled>Задание закрыто</button>
              ) : mission.user_has_taken ? (
                <div className="mission-actions"><div className="mission-status-note">{mission.is_contract ? `Вы откликнулись на контракт с ценой ${mission.current_bid_reward || 0} GRZ` : "Задание уже выбрано вашим Легионом"}</div>{mission.is_contract ? <form method="POST" action="/missions/accept"><div className="mb-2"><input className="form-control" name="bid_reward" type="number" min="0" step="1" defaultValue={mission.current_bid_reward || 0} required /></div><input type="hidden" name="mission_id" value={mission.id} /><button type="submit" className="btn btn-primary">Изменить цену</button></form> : null}<form method="POST" action="/missions/cancel"><input type="hidden" name="mission_id" value={mission.id} /><button type="submit" className="btn btn-outline-light">Отказаться от задания</button></form></div>
              ) : !mission.is_contract && mission.accepted_count >= (mission.max_accepted_count || 3) ? (
                <button type="button" className="btn btn-secondary" disabled>Лимит легионов достигнут</button>
              ) : current_team_mission_count >= 3 ? (
                <button type="button" className="btn btn-secondary" disabled>Легион уже взял 3 задания</button>
              ) : (
                <div className="mission-actions"><form method="POST" action="/missions/accept">{mission.is_contract ? <div className="mb-2"><input className="form-control" name="bid_reward" type="number" min="0" step="1" placeholder="Ваша цена в GRZ" required /></div> : null}<input type="hidden" name="mission_id" value={mission.id} /><button type="submit" className="btn btn-primary">{mission.is_contract ? "Откликнуться на контракт" : "Принять задание"}</button></form></div>
              )
            ) : (
              <button type="button" className="btn btn-secondary" disabled>Журналист не может принимать задания</button>
            )}
          </article>
        ))}
        {!missions.length ? <section className="placeholder-card"><h3>Заданий пока нет</h3><p>Добавленные администратором задания отображаются здесь.</p></section> : null}
      </div>
    </div>
  );
}

function AdminBankView({ scoreboard = [] }) {
  return (
    <div className="row content">
      <div className="scoreboard-panel bank-scoreboard-panel">
        <div className="placeholder-hero section-title-panel bank-scoreboard-hero"><h1>ГЕРЦЫ ЛЕГИОНОВ</h1></div>
        <section className="placeholder-card table-card bank-table-card">
          <div className="table-responsive bank-table-responsive">
            <table className="table elegant-table bank-table bank-scoreboard-table">
              <thead><tr><th>ЛЕГИОН</th><th>Итого:</th></tr></thead>
              <tbody>{scoreboard.map((row, index) => <tr key={`${row.Name}-${index}`}><td data-label="Легион">{row.Name}</td><td data-label="Итого">{row.Scores}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function UserBankView({ current_plt }) {
  return (
    <section className="bank-balance-strip">
      <h3>
        <span className="bank-balance-label">Герцы твоего Легиона:</span>
        <span className="badge text-bg-success">{current_plt}</span>
      </h3>
    </section>
  );
}

function BankOperations({ is_admin = false, current_team_id = null, current_plt = 0, operations = [], teams_for_select = [] }) {
  const transferPossible = is_admin || current_plt > 0;
  const adminSource = teams_for_select.find((team) => team.isAdmin) || teams_for_select[0] || null;
  const defaultSourceId = adminSource ? adminSource.id : "";
  const defaultTargetId = adminSource ? adminSource.id : (teams_for_select[0] ? teams_for_select[0].id : "");
  const defaultMax = is_admin ? (adminSource ? adminSource.balance : 0) : current_plt;
  const defaultScore = transferPossible && (is_admin || current_plt >= 1) ? 1 : 0;

  return (
    <>
      <div className="bank-action-bar"><button type="button" className="btn btn-primary bank-action-button" data-bs-toggle="modal" data-bs-target="#exampleModal">Отправить герцы Легиону</button></div>
      <div className="modal fade" id="exampleModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <form method="POST" action="/api/add_operation">
          <div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h1 className="modal-title fs-5" id="exampleModalLabel">Форма отправки герцев</h1><button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button></div>
          <div className="modal-body">
            {!is_admin ? <input name="parent" type="hidden" id="parent" value={current_team_id || ""} /> : <><label htmlFor="userSRC">Выберите фракцию отправителя:</label><select className="form-control" id="userSRC" name="parent" defaultValue={defaultSourceId}>{teams_for_select.map((team) => <option key={`src-${team.id}`} value={team.id} data-balance={team.balance}>{team.name}</option>)}</select></>}
            <label htmlFor="usersDST">Выберите легион получателя:</label>
            <select className="form-control" id="usersDST" name="user" defaultValue={defaultTargetId}>{teams_for_select.map((team) => <option key={`dst-${team.id}`} value={team.id}>{team.name}</option>)}</select>
            <label htmlFor="PLT">Количество GRZ:</label>
            <input name="score" type="number" min="0" max={defaultMax} step="1" defaultValue={defaultScore} id="PLT" className="form-control" placeholder="цена" disabled={!transferPossible && !is_admin} />
            <label htmlFor="comment">Комментарий Легиону:</label>
            <input name="comment" type="text" className="form-control" id="comment" placeholder="Введите сообщение Легиону" />
            <div className="form-text" id="transferState">{!is_admin && current_plt <= 0 ? "Перевод недоступен: у текущего легиона нулевой баланс." : ""}</div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button><button type="submit" className="btn btn-primary" id="transferSubmit" disabled={!transferPossible && !is_admin}>Отправить</button></div></div></div>
        </form>
      </div>
      <div className="events-panel bank-operations-panel">
        <h3 className="events-title">Все события:</h3>
        <section className="placeholder-card table-card bank-table-card"><div className="table-responsive bank-table-responsive"><table className="table elegant-table bank-table bank-operations-table"><thead><tr><th>Период:</th><th>Название легиона:</th><th>Герцы:</th><th>Коммент:</th></tr></thead><tbody>{operations.map((row, index) => <tr key={`${row.Name}-${row.Period}-${index}`}><td data-label="Период">{formatDate(row.Period)}</td><td data-label="Легион">{row.Name}</td><td data-label="Герцы">{row.Score}</td><td data-label="Коммент">{row.Comment}</td></tr>)}</tbody></table></div></section>
      </div>
    </>
  );
}

export function TeamsPage(props) {
  return <div className="bank-page section-page">{props.is_admin ? <AdminBankView scoreboard={props.scoreboard} /> : <UserBankView current_plt={props.current_plt} />}<BankOperations {...props} /></div>;
}

function groupApproveItems(items, groupBy) {
  const groups = new Map();
  const fallbackLabel = groupBy === "teams" ? "Без легиона" : "Без названия";

  items.forEach((item) => {
    const label = (groupBy === "teams" ? item.team_name : item.title) || fallbackLabel;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(item);
  });

  const groupedItems = Array.from(groups, ([label, groupItems]) => ({ label, items: groupItems }));

  if (groupBy !== "teams") return groupedItems;

  return groupedItems.sort((left, right) => {
    const leftTeamId = Number(left.items[0]?.team_id || 0);
    const rightTeamId = Number(right.items[0]?.team_id || 0);
    return leftTeamId - rightTeamId;
  });
}

function ApproveCard({ item }) {
  return (
    <article className={`placeholder-card mission-card${item.is_contract ? " mission-card-contract" : ""}`} key={item.id}>
      <div className="news-meta"><span>{item.team_name}</span><span>{formatDateTime(item.accepted_at)}</span></div>
      <h3>{item.title}</h3>
      <p className="news-content">{item.description}</p>
      <div className="mission-info"><span>Отряд: {item.team_name}</span><span>{item.is_contract ? `Цена легиона: ${item.bid_reward || 0} GRZ` : `Награда: ${item.reward} GRZ + 10 влияния`}</span></div>
      <div className="approve-actions">
        <form method="POST" action="/approve/confirm">
          {item.is_contract ? null : <input className="form-control mb-2" name="approved_reward" type="number" min="0" step="1" defaultValue={item.reward} />}
          <input type="hidden" name="assignment_id" value={item.id} />
          <button type="submit" className="btn btn-primary">{item.is_contract ? "Передать контракт" : "Подтвердить выполнение"}</button>
        </form>
        <form method="POST" action="/approve/reject">
          <input type="hidden" name="assignment_id" value={item.id} />
          <button type="submit" className="btn btn-outline-light">Отклонить выполнение</button>
        </form>
      </div>
    </article>
  );
}

export function ApprovePage({ approve_items = [] }) {
  const [groupBy, setGroupBy] = useState("missions");
  const groupedItems = useMemo(() => groupApproveItems(approve_items, groupBy), [approve_items, groupBy]);

  return (
    <div className="section-page">
      <Hero title="Подтверждение" description="Здесь администратор подтверждает или отклоняет выполнение принятых заданий. После подтверждения награда автоматически начисляется отряду." />
      {approve_items.length ? (
        <section className="approve-toolbar-card">
          <div className="approve-toolbar">
            <div className="approve-sort-label">Группировка</div>
            <div className="approve-group-toggle" role="tablist" aria-label="Группировка подтверждений">
              <button type="button" className={`approve-group-option${groupBy === "missions" ? " is-active" : ""}`} onClick={() => setGroupBy("missions")}>По заданиям</button>
              <button type="button" className={`approve-group-option${groupBy === "teams" ? " is-active" : ""}`} onClick={() => setGroupBy("teams")}>По легионам</button>
            </div>
          </div>
        </section>
      ) : null}
      <div className="news-list">
        {groupedItems.map((group, index) => (
          <section className="approve-group" key={`${group.label}-${index}`}>
            <div className="approve-group-header">
              <h3 className="approve-group-title">{groupBy === "teams" ? `Легион: ${group.label}` : group.label}</h3>
            </div>
            <div className="approve-group-list">
              {group.items.map((item) => <ApproveCard key={item.id} item={item} />)}
            </div>
          </section>
        ))}
        {!approve_items.length ? <section className="placeholder-card"><h3>Нет заданий на подтверждение</h3><p>Принятые задания отображаются в этом списке.</p></section> : null}
      </div>
    </div>
  );
}

function StudiosCreateForm() {
  const audienceOptions = [
    { value: "middle", label: "Средние (ID 6-9)" },
    { value: "senior", label: "Старшие (ID 10-13)" },
    { value: "all", label: "Для всех" }
  ];

  return (
    <section className="placeholder-card news-form-card news-suggest-card studios-form-card">
      <details className="news-edit-block news-suggest-block is-collapsed studios-create-block">
        <summary className="news-edit-summary">Добавить гильдию</summary>
        <div className="news-edit-body">
          <form method="POST" action="/studios/add" encType="multipart/form-data" className="news-edit-form">
            <div className="mb-3">
              <label className="form-label" htmlFor="studio-title">Название гильдии</label>
              <input className="form-control" id="studio-title" name="title" type="text" required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="studio-description">Описание гильдии</label>
              <textarea className="form-control" id="studio-description" name="description" rows="5" required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="studio-image">Изображение</label>
              <input className="form-control" id="studio-image" name="image" type="file" accept=".png,.jpg,.jpeg,.gif,.webp" />
              <div className="form-text text-light">Картинка необязательна. Если нужна, лучше одно изображение на гильдию.</div>
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="studio-audience">Показывать группе</label>
              <select className="form-control" id="studio-audience" name="audience" defaultValue="all">
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Добавить гильдию</button>
          </form>
        </div>
      </details>
    </section>
  );
}

function StudioEditBlock({ item }) {
  const audienceOptions = [
    { value: "middle", label: "Средние (ID 6-9)" },
    { value: "senior", label: "Старшие (ID 10-13)" },
    { value: "all", label: "Для всех" }
  ];

  return (
    <details className="news-edit-block news-edit-action is-collapsed">
      <summary className="news-edit-summary">Редактировать гильдию</summary>
      <div className="news-edit-body">
        <form method="POST" action="/studios/update" encType="multipart/form-data" className="news-edit-form">
          <input type="hidden" name="studio_id" value={item.id} />
          <div className="mb-3">
            <label className="form-label" htmlFor={`studio-edit-title-${item.id}`}>Название гильдии</label>
            <input className="form-control" id={`studio-edit-title-${item.id}`} name="title" type="text" defaultValue={item.title} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor={`studio-edit-description-${item.id}`}>Описание гильдии</label>
            <textarea className="form-control" id={`studio-edit-description-${item.id}`} name="description" rows="5" defaultValue={item.description} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor={`studio-edit-audience-${item.id}`}>Показывать группе</label>
            <select className="form-control" id={`studio-edit-audience-${item.id}`} name="audience" defaultValue={item.audience || "all"}>
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          {item.image_path ? (
            <div className="mb-3">
              <div className="form-label">Текущее изображение</div>
              <img className="news-edit-media-preview" src={uploadedPath(item.image_path)} alt={item.title} loading="lazy" decoding="async" />
              <label className="news-edit-remove">
                <input type="checkbox" name="remove_image" value="1" />
                <span>Убрать изображение</span>
              </label>
            </div>
          ) : null}
          <div className="mb-3">
            <label className="form-label" htmlFor={`studio-edit-image-${item.id}`}>Новое изображение</label>
            <input className="form-control" id={`studio-edit-image-${item.id}`} name="image" type="file" accept=".png,.jpg,.jpeg,.gif,.webp" />
          </div>
          <button type="submit" className="btn btn-primary">Сохранить изменения</button>
        </form>
      </div>
    </details>
  );
}

function StudioCard({ item, canManageStudios }) {
  const audienceLabels = {
    middle: "Для средних",
    senior: "Для старших",
    all: "Для всех"
  };

  return (
    <article className="placeholder-card news-card studio-card">
      <div className="news-meta">
        <span>{item.author_name}</span>
        <span>{formatDateTime(item.created_at)}</span>
      </div>
      {canManageStudios ? (
        <div className="news-suggestion-status">{audienceLabels[item.audience] || audienceLabels.all}</div>
      ) : null}
      <h3>{item.title}</h3>
      {item.image_path ? <img className="news-image studio-image" src={uploadedPath(item.image_path)} alt={item.title} loading="lazy" decoding="async" /> : null}
      <p className="news-content">{item.description}</p>
      {canManageStudios ? (
        <div className="news-card-actions studio-card-actions">
          <StudioEditBlock item={item} />
          <form
            method="POST"
            action="/studios/delete"
            onSubmit={(event) => {
              if (!window.confirm("Вы уверены, что хотите удалить эту кафедру?")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="studio_id" value={item.id} />
            <button type="submit" className="btn btn-outline-light">Удалить гильдию</button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

export function StudiosPage({ studios_items = [], can_manage_studios = false }) {
  return (
    <div className="section-page studios-page ceremonial-page">
      <Hero
        title="Гильдии"
        description="Здесь собраны гильдии Империи."
      />
      {can_manage_studios ? <StudiosCreateForm /> : null}
      <div className="news-list">
        {studios_items.map((item) => (
          <StudioCard key={item.id} item={item} canManageStudios={can_manage_studios} />
        ))}
        {!studios_items.length ? (
          <section className="placeholder-card">
            <h3>Гильдий пока нет</h3>
            <p>Добавленные администратором гильдии появятся здесь.</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function PlaceholderPage({ section_title, section_description }) {
  return <div className="section-page"><Hero title={section_title} description={section_description} /></div>;
}
