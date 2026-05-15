import { Hero, formatDate, formatDateTime, uploadedPath } from "./shared";

export function MissionsPage({ is_admin = false, can_take_missions = false, current_team_mission_count = 0, missions = [] }) {
  return (
    <div className="section-page">
      <Hero title="Миссии за валюту" description="Легион может взять до 3 заданий одновременно. На одно задание могут откликнуться не более 3 легионов." />
      {is_admin ? (
        <section className="placeholder-card mission-form-card">
          <h3>Добавить задание</h3>
          <form method="POST" action="/missions/add">
            <div className="mb-3"><label className="form-label" htmlFor="mission-title">Название задания</label><input className="form-control" id="mission-title" name="title" type="text" required /></div>
            <div className="mb-3"><label className="form-label" htmlFor="mission-description">Текст задания</label><textarea className="form-control" id="mission-description" name="description" rows="5" required /></div>
            <div className="mb-3"><label className="form-label" htmlFor="mission-reward">Награда</label><input className="form-control" id="mission-reward" name="reward" type="number" min="1" step="1" required /></div>
            <button type="submit" className="btn btn-primary">Опубликовать задание</button>
          </form>
        </section>
      ) : (
        <div className="mission-limit-note">{can_take_missions ? <>Активных заданий у Легиона: {current_team_mission_count} / 3</> : <>Журналисты могут только просматривать задания и не могут их принимать.</>}</div>
      )}
      <div className="news-list">
        {missions.map((mission) => (
          <article className="placeholder-card mission-card" key={mission.id}>
            <div className="news-meta"><span>{mission.author_name}</span><span>{formatDateTime(mission.created_at)}</span></div>
            <h3>{mission.title}</h3>
            <p className="news-content">{mission.description}</p>
            <div className="mission-info"><span>Награда: {mission.reward} GRZ</span><span>Откликнулось легионов: {mission.accepted_count} / 3</span></div>
            {mission.accepted_teams && mission.accepted_teams.length ? <div className="mission-teams">Приняли задание: {mission.accepted_teams.join(", ")}</div> : null}
            {is_admin ? (
              <div className="mission-actions mission-admin-actions"><form method="POST" action="/missions/delete" onSubmit={(event) => { if (!window.confirm("Вы уверены?")) { event.preventDefault(); } }}><input type="hidden" name="mission_id" value={mission.id} /><button type="submit" className="btn btn-outline-light">Удалить миссию</button></form></div>
            ) : can_take_missions ? (
              mission.user_has_taken ? (
                <div className="mission-actions"><div className="mission-status-note">Задание уже выбрано вашим Легионом</div><form method="POST" action="/missions/cancel"><input type="hidden" name="mission_id" value={mission.id} /><button type="submit" className="btn btn-outline-light">Отказаться от задания</button></form></div>
              ) : mission.accepted_count >= 3 ? (
                <button type="button" className="btn btn-secondary" disabled>Лимит легионов достигнут</button>
              ) : current_team_mission_count >= 3 ? (
                <button type="button" className="btn btn-secondary" disabled>Легион уже взял 3 задания</button>
              ) : (
                <div className="mission-actions"><form method="POST" action="/missions/accept"><input type="hidden" name="mission_id" value={mission.id} /><button type="submit" className="btn btn-primary">Принять задание</button></form></div>
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
  return <h3>ГЕРЦЫ ТВОЕГО ЛЕГИОНА: <span className="badge text-bg-success">{current_plt}</span></h3>;
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
      <div className="bank-action-bar"><button type="button" className="btn btn-primary bank-action-button" data-bs-toggle="modal" data-bs-target="#exampleModal">Отправить герцы легиону</button></div>
      <div className="modal fade" id="exampleModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <form method="POST" action="/api/add_operation">
          <div className="modal-dialog"><div className="modal-content"><div className="modal-header"><h1 className="modal-title fs-5" id="exampleModalLabel">Форма отправки герцев</h1><button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button></div>
          <div className="modal-body">
            {!is_admin ? <input name="parent" type="hidden" id="parent" value={current_team_id || ""} /> : <><label htmlFor="userSRC">Выберите легион отправителя:</label><select className="form-control" id="userSRC" name="parent" defaultValue={defaultSourceId}>{teams_for_select.map((team) => <option key={`src-${team.id}`} value={team.id} data-balance={team.balance}>{team.name}</option>)}</select></>}
            <label htmlFor="usersDST">Выберите легион получателя:</label>
            <select className="form-control" id="usersDST" name="user" defaultValue={defaultTargetId}>{teams_for_select.map((team) => <option key={`dst-${team.id}`} value={team.id}>{team.name}</option>)}</select>
            <label htmlFor="PLT">Количество GRZ:</label>
            <input name="score" type="number" min="0" max={defaultMax} step="1" defaultValue={defaultScore} id="PLT" className="form-control" placeholder="цена" disabled={!transferPossible && !is_admin} />
            <label htmlFor="comment">Комментарий:</label>
            <input name="comment" type="text" className="form-control" id="comment" placeholder="Введите сообщение команде" />
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

export function ApprovePage({ approve_items = [] }) {
  return (
    <div className="section-page">
      <Hero title="Подтверждение" description="Здесь администратор подтверждает или отклоняет выполнение принятых заданий. После подтверждения награда автоматически начисляется отряду." />
      <div className="news-list">
        {approve_items.map((item) => (
          <article className="placeholder-card mission-card" key={item.id}><div className="news-meta"><span>{item.team_name}</span><span>{formatDateTime(item.accepted_at)}</span></div><h3>{item.title}</h3><p className="news-content">{item.description}</p><div className="mission-info"><span>Отряд: {item.team_name}</span><span>Награда: {item.reward} GRZ</span></div><div className="approve-actions"><form method="POST" action="/approve/confirm"><input type="hidden" name="assignment_id" value={item.id} /><button type="submit" className="btn btn-primary">Подтвердить выполнение</button></form><form method="POST" action="/approve/reject"><input type="hidden" name="assignment_id" value={item.id} /><button type="submit" className="btn btn-outline-light">Отклонить выполнение</button></form></div></article>
        ))}
        {!approve_items.length ? <section className="placeholder-card"><h3>Нет заданий на подтверждение</h3><p>Принятые задания отображаются в этом списке.</p></section> : null}
      </div>
    </div>
  );
}

function StudiosCreateForm() {
  return (
    <section className="placeholder-card news-form-card news-suggest-card studios-form-card">
      <details className="news-edit-block news-suggest-block is-collapsed studios-create-block">
        <summary className="news-edit-summary">Добавить студию</summary>
        <div className="news-edit-body">
          <form method="POST" action="/studios/add" encType="multipart/form-data" className="news-edit-form">
            <div className="mb-3">
              <label className="form-label" htmlFor="studio-title">Название студии</label>
              <input className="form-control" id="studio-title" name="title" type="text" required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="studio-description">Описание студии</label>
              <textarea className="form-control" id="studio-description" name="description" rows="5" required />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="studio-image">Изображение</label>
              <input className="form-control" id="studio-image" name="image" type="file" accept=".png,.jpg,.jpeg,.gif,.webp" />
              <div className="form-text text-light">Картинка необязательна. Если нужна, лучше одно изображение на студию.</div>
            </div>
            <button type="submit" className="btn btn-primary">Добавить студию</button>
          </form>
        </div>
      </details>
    </section>
  );
}

function StudioCard({ item, canManageStudios }) {
  return (
    <article className="placeholder-card news-card studio-card">
      <div className="news-meta">
        <span>{item.author_name}</span>
        <span>{formatDateTime(item.created_at)}</span>
      </div>
      <h3>{item.title}</h3>
      {item.image_path ? <img className="news-image studio-image" src={uploadedPath(item.image_path)} alt={item.title} /> : null}
      <p className="news-content">{item.description}</p>
      {canManageStudios ? (
        <div className="news-card-actions studio-card-actions">
          <form
            method="POST"
            action="/studios/delete"
            onSubmit={(event) => {
              if (!window.confirm("Вы уверены, что хотите удалить эту студию?")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="studio_id" value={item.id} />
            <button type="submit" className="btn btn-outline-light">Удалить студию</button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

export function StudiosPage({ studios_items = [], can_manage_studios = false }) {
  return (
    <div className="section-page studios-page">
      <Hero
        title="Студии"
        description="Здесь собраны студии Империи. Администратор может добавлять новые студии, а сами карточки удобно просматривать на телефоне и компьютере."
      />
      {can_manage_studios ? <StudiosCreateForm /> : null}
      <div className="news-list">
        {studios_items.map((item) => (
          <StudioCard key={item.id} item={item} canManageStudios={can_manage_studios} />
        ))}
        {!studios_items.length ? (
          <section className="placeholder-card">
            <h3>Студий пока нет</h3>
            <p>Добавленные администратором студии появятся здесь.</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function PlaceholderPage({ section_title, section_description }) {
  return <div className="section-page"><Hero title={section_title} description={section_description} /></div>;
}
