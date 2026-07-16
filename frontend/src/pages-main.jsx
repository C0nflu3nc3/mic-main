import { Hero, LoginMessages, formatDateTime, uploadedPath } from "./shared";

export function LoginPage({ messages }) {
  return (
    <div className="container-fluid text-center">
      <div className="row justify-content-center align-items-center login-layout auth-page">
        <div className="col-11 col-sm-9 col-md-5 col-lg-5 d-flex justify-content-center login-brand-col">
          <div className="logo-panel">
            <span className="logo-orbit" aria-hidden="true" />
            <img src="/static/logo_login.png" title="logo" alt="logo" width="220" height="220" className="img-fluid login-logo" decoding="async" />
          </div>
        </div>

        <div className="col-11 col-sm-10 col-md-7 col-lg-5 login-form-col">
          <form action="/signin" method="post" className="login-card">
            <div className="login-card-divider login-card-divider-top" aria-hidden="true" />
            <h1 className="text-center">Авторизация</h1>
            <div className="login-card-divider" aria-hidden="true" />

            <div className="form-outline mb-4 text-start login-field login-field-user">
              <label className="form-label" htmlFor="login">Логин</label>
              <input type="text" name="login" id="login" className="form-control" placeholder="Введите свой логин" />
            </div>

            <div className="form-outline mb-4 text-start login-field login-field-pass">
              <label className="form-label" htmlFor="password">Пароль</label>
              <input type="password" name="password" id="password" className="form-control" placeholder="Введите пароль" />
            </div>

            <LoginMessages messages={messages} />

            <button type="submit" className="btn btn-primary w-100 mb-4">Войти</button>
            <div className="login-card-divider login-card-divider-bottom" aria-hidden="true" />
          </form>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const cards = [
    { href: "/leaderboard", title: "Таблица лидеров", icon: "🏆", variant: "leaderboard", text: "Здесь отображается общий рейтинг легионов по очкам влияния." },
    { href: "/news", title: "Новости", icon: "📜", variant: "news", text: "Здесь публикуются новости с изображениями и видео, а пользователи добавляют комментарии." },
    { href: "/missions", title: "Доска заказов", icon: "✦", variant: "missions", text: "Здесь легионы выбирают задания, видят лимиты по контрактам и отправляют выполнение на подтверждение." }
  ];

  return (
    <div className="section-page home-page ceremonial-page">
      <Hero title="Главная страница" description="Здесь отображаются основные разделы системы: таблица лидеров, новости и миссии за валюту." />
      <div className="placeholder-grid">
        {cards.map((card) => (
          <section className={`placeholder-card home-feature-card home-feature-${card.variant}`} key={card.href}>
            <span className="home-feature-medallion" aria-hidden="true">
              <span className="home-feature-glyph">{card.icon}</span>
            </span>
            <a className="placeholder-card-link home-feature-link" href={card.href}>{card.title}</a>
            <span className="home-feature-divider" aria-hidden="true" />
            <p>{card.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function LeaderboardEditBlock({ tableName, rows }) {
  if (!rows.length) return null;

  const selectId = `${tableName}-editor-user`;
  const nameId = `${tableName}-editor-name`;
  const scoreId = `${tableName}-editor-score`;
  const reasonId = `${tableName}-editor-reason`;
  const stateId = `${tableName}-editor-state`;
  const defaultRow = rows[0];

  return (
    <details className="news-edit-block news-edit-action is-collapsed leaderboard-edit-block">
      <summary className="news-edit-summary leaderboard-edit-summary">Изменить таблицу</summary>
      <div className="news-edit-body">
        <section className="placeholder-card leaderboard-editor-card">
          <form method="POST" action="/leaderboard/update" className="news-edit-form leaderboard-edit-form">
            <input type="hidden" name="table_name" value={tableName} />
            <input id={nameId} name="name" type="hidden" defaultValue={defaultRow.Name} />
            <label htmlFor={selectId}>Легион</label>
            <select className="form-control" id={selectId} name="user_id" defaultValue={defaultRow.user_id} data-leaderboard-sync="true" data-name-target={nameId} data-score-target={scoreId} data-state-target={stateId}>
              {rows.map((row) => (
                <option key={`${tableName}-${row.user_id}`} value={row.user_id} data-name={row.Name} data-score={row.Scores}>{row.Name}</option>
              ))}
            </select>
            <label htmlFor={scoreId}>Очки</label>
            <input className="form-control" id={scoreId} name="score" type="number" defaultValue={defaultRow.Scores} required />
            <label htmlFor={reasonId}>Комментарий в лог</label>
            <textarea className="form-control" id={reasonId} name="reason" rows="3" maxLength="255" placeholder="Например: бонус, штраф или исправление баллов"></textarea>
            <div className="form-text" id={stateId}>{`Сейчас у легиона ${defaultRow.Scores} очков влияния.`}</div>
            <div className="leaderboard-edit-actions">
              <button type="submit" className="btn btn-primary">Сохранить</button>
            </div>
          </form>
        </section>
      </div>
    </details>
  );
}

function InfluenceLogBlock({ rows }) {
  return (
    <details className="news-edit-block is-collapsed">
      <summary className="news-edit-summary">Логи начислений</summary>
      <div className="news-edit-body">
        <section className="placeholder-card table-card">
          <div className="table-responsive">
            <table className="table elegant-table">
              <thead>
                <tr><th>Время</th><th>Легион</th><th>Начисление</th><th>Причина</th></tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((row, index) => (
                  <tr key={`${row.user_id}-${row.created_at}-${index}`}>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td>{row.name}</td>
                    <td>{row.delta > 0 ? `+${row.delta}` : row.delta}</td>
                    <td>{row.reason}</td>
                  </tr>
                )) : <tr><td colSpan="4">Логов пока нет</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </details>
  );
}

function LeaderboardTable({ title, rows, tableName, canManageLeaderboards }) {
  return (
    <section className="leaderboard-panel">
      <h3 className="leaderboard-title">{title}</h3>
      <div className="placeholder-card table-card">
        <div className="table-responsive">
          <table className="table elegant-table">
            <thead>
              <tr><th>ЛЕГИОН</th><th>Очки</th></tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.Name}-${index}`}><td>{row.Name}</td><td>{row.Scores}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {canManageLeaderboards ? <LeaderboardEditBlock tableName={tableName} rows={rows} /> : null}
      </div>
    </section>
  );
}

export function LeaderboardPage({ overall_leaderboard = [], influence_logs = [], can_manage_leaderboards = false, leaderboard_hidden_for_users = false }) {
  return (
    <div className="section-page leaderboard-page ceremonial-page">
      <Hero title="Таблица лидеров" description="Здесь отображается общий рейтинг легионов по очкам влияния." extraClass="leaderboard-hero" />
      {can_manage_leaderboards ? (
        <form method="POST" action="/leaderboard/toggle-visibility" className="mb-4">
          <input type="hidden" name="hidden" value={leaderboard_hidden_for_users ? "0" : "1"} />
          <button type="submit" className="btn btn-primary">
            {leaderboard_hidden_for_users ? "Показать таблицу легионам" : "Скрыть таблицу для легионов"}
          </button>
        </form>
      ) : null}
      {!can_manage_leaderboards && leaderboard_hidden_for_users ? (
        <section className="placeholder-card">
          <h3>Таблица лидеров скрыта</h3>
          <p>Сейчас рейтинг временно доступен только администраторам.</p>
        </section>
      ) : (
        <div className="leaderboard-grid">
          <LeaderboardTable title="Очки влияния" rows={overall_leaderboard} tableName="Overall_leader" canManageLeaderboards={can_manage_leaderboards} />
        </div>
      )}
      {can_manage_leaderboards ? <InfluenceLogBlock rows={influence_logs} /> : null}
    </div>
  );
}

function NewsMedia({ media, title }) {
  if (!media || !media.length) return null;

  return (
    <div className="news-media-list">
      {media.map((item, index) => item.media_type === "video" ? (
        <video className="news-video" controls preload="metadata" key={`${item.media_path}-${index}`}>
          <source src={uploadedPath(item.media_path)} />
          Ваш браузер не поддерживает встроенное видео.
        </video>
      ) : (
        <img className="news-image" src={uploadedPath(item.media_path)} alt={title} loading="lazy" decoding="async" key={`${item.media_path}-${index}`} />
      ))}
    </div>
  );
}

function NewsEditBlock({ item, summaryLabel = "Редактировать новость", redirectTo = "" }) {
  return (
    <details className="news-edit-block news-edit-action is-collapsed">
      <summary className="news-edit-summary">{summaryLabel}</summary>
      <div className="news-edit-body">
        <form method="POST" action="/news/update" encType="multipart/form-data" className="news-edit-form">
          <input type="hidden" name="news_id" value={item.id} />
          {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}
          <div className="mb-3">
            <label className="form-label" htmlFor={`edit-title-${item.id}`}>Заголовок</label>
            <input className="form-control" id={`edit-title-${item.id}`} name="title" type="text" defaultValue={item.title} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor={`edit-content-${item.id}`}>Текст новости</label>
            <textarea className="form-control" id={`edit-content-${item.id}`} name="content" rows="5" defaultValue={item.content} required />
          </div>
          {item.media && item.media.length ? (
            <div className="mb-3">
              <div className="form-label">Текущие медиа</div>
              <div className="news-edit-existing-media">
                {item.media.map((media, index) => (
                  <label className="news-edit-media-item" key={`${media.media_path}-${index}`}>
                    {media.media_type === "video" ? (
                      <video className="news-edit-media-preview" controls preload="metadata"><source src={uploadedPath(media.media_path)} /></video>
                    ) : (
                      <img className="news-edit-media-preview" src={uploadedPath(media.media_path)} alt={item.title} loading="lazy" decoding="async" />
                    )}
                    <span className="news-edit-media-meta">{media.media_type === "video" ? "Видео" : "Изображение"}</span>
                    <span className="news-edit-remove"><input type="checkbox" name="remove_media_ids" value={media.id} /><span>Убрать из новости</span></span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mb-3">
            <label className="form-label" htmlFor={`edit-media-${item.id}`}>Добавить медиа</label>
            <input className="form-control" id={`edit-media-${item.id}`} name="media" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v" multiple />
            <div className="form-text text-light">Всего в новости можно оставить до 3 файлов.</div>
          </div>
          <button type="submit" className="btn btn-primary">Сохранить изменения</button>
        </form>
      </div>
    </details>
  );
}

function NewsDeleteForm({ newsId, redirectTo = "" }) {
  return (
    <form
      method="POST"
      action="/news/delete"
      onSubmit={(event) => {
        if (!window.confirm("Удалить новость?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="news_id" value={newsId} />
      {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}
      <button type="submit" className="btn btn-outline-light">Удалить новость</button>
    </form>
  );
}

function getSuggestedNewsStatusLabel(reviewStatus) {
  if (reviewStatus === "rejected") return "Отклонено";
  if (reviewStatus === "published") return "Опубликовано";
  return "На рассмотрении";
}

function getSuggestedNewsStatusClassName(reviewStatus) {
  return reviewStatus === "rejected"
    ? "news-suggestion-status is-rejected"
    : "news-suggestion-status";
}

function NewsRejectBlock({ newsId }) {
  return (
    <details className="news-edit-block news-edit-action is-collapsed">
      <summary className="news-edit-summary">Отклонить</summary>
      <div className="news-edit-body">
        <form method="POST" action="/news/reject" className="news-edit-form">
          <input type="hidden" name="news_id" value={newsId} />
          <div className="mb-3">
            <label className="form-label" htmlFor={`reject-comment-${newsId}`}>Комментарий для легиона</label>
            <textarea
              className="form-control"
              id={`reject-comment-${newsId}`}
              name="review_comment"
              rows="3"
              placeholder="Например: поправьте формулировки или добавьте источник"
            />
          </div>
          <button type="submit" className="btn btn-outline-light">Отклонить новость</button>
        </form>
      </div>
    </details>
  );
}

function SuggestedNewsForm() {
  return (
    <section className="placeholder-card news-form-card news-suggest-card">
      <details className="news-edit-block news-suggest-block is-collapsed">
        <summary className="news-edit-summary">Предложить новость</summary>
        <div className="news-edit-body">
          <form method="POST" action="/news/suggest" encType="multipart/form-data" className="news-edit-form">
            <div className="mb-3"><label className="form-label" htmlFor="suggest-title">Заголовок</label><input className="form-control" id="suggest-title" name="title" type="text" required /></div>
            <div className="mb-3"><label className="form-label" htmlFor="suggest-content">Текст новости</label><textarea className="form-control" id="suggest-content" name="content" rows="5" required /></div>
            <div className="mb-3"><label className="form-label" htmlFor="suggest-media">Медиафайлы</label><input className="form-control" id="suggest-media" name="media" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v" multiple /><div className="form-text text-light">До 3 файлов: изображения или видео.</div></div>
            <button type="submit" className="btn btn-primary">Отправить на рассмотрение</button>
          </form>
        </div>
      </details>
    </section>
  );
}

function NewsCommentItem({ comment, newsId, currentUserId, canManageNews }) {
  const canDelete = canManageNews || Number(comment.user_id) === Number(currentUserId);

  return (
    <div className="news-comment">
      <div className="news-comment-meta">
        <strong>{comment.author_name}</strong>
        <span>{formatDateTime(comment.created_at)}</span>
      </div>
      <p>{comment.comment}</p>
      <div className="news-comment-actions">
        <details className="news-reply-block is-collapsed">
          <summary className="news-reply-summary">Ответить</summary>
          <div className="news-edit-body">
            <form method="POST" action="/news/comment" className="news-reply-form">
              <input type="hidden" name="news_id" value={newsId} />
              <input type="hidden" name="parent_comment_id" value={comment.id} />
              <textarea className="form-control mb-2" name="comment" rows="3" placeholder="Напишите ответ" required />
              <button type="submit" className="btn btn-outline-light">Отправить ответ</button>
            </form>
          </div>
        </details>
        {canDelete ? (
          <form method="POST" action="/news/comment/delete" className="news-delete-comment-form">
            <input type="hidden" name="comment_id" value={comment.id} />
            <button type="submit" className="news-comment-action-link">Удалить</button>
          </form>
        ) : null}
      </div>
      {comment.replies && comment.replies.length ? (
        <div className="news-comment-replies">
          {comment.replies.map((reply) => (
            <NewsCommentItem
              key={reply.id}
              comment={reply}
              newsId={newsId}
              currentUserId={currentUserId}
              canManageNews={canManageNews}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function NewsPage({
  news_items = [],
  can_manage_news = false,
  can_suggest_news = false,
  pending_news_count = 0,
  user = null
}) {
  const pendingCount = Number(pending_news_count) || 0;
  const showSuggestionsLink = can_manage_news || can_suggest_news;
  const suggestionsLinkLabel = can_manage_news ? "Предложенные новости" : "Моя предложка";

  return (
    <div className="section-page news-page ceremonial-page">
      <Hero title="Новости" description="Здесь публикуются новости проекта, изображения, видео и комментарии пользователей." />
      {showSuggestionsLink ? (
        <div className="news-page-actions">
          <a className="btn btn-outline-light news-suggestions-link" href="/news/suggestions">
            {suggestionsLinkLabel}
            {can_manage_news && pendingCount ? <span className="news-page-badge">{pendingCount}</span> : null}
          </a>
        </div>
      ) : null}

      {can_manage_news ? (
        <section className="placeholder-card news-form-card">
          <h3>Добавить новость</h3>
          <form method="POST" action="/news/add" encType="multipart/form-data">
            <div className="mb-3"><label className="form-label" htmlFor="title">Заголовок</label><input className="form-control" id="title" name="title" type="text" required /></div>
            <div className="mb-3"><label className="form-label" htmlFor="content">Текст новости</label><textarea className="form-control" id="content" name="content" rows="5" required /></div>
            <div className="mb-3"><label className="form-label" htmlFor="media">Медиафайлы</label><input className="form-control" id="media" name="media" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v" multiple /><div className="form-text text-light">До 3 файлов: изображения или видео.</div></div>
            <button type="submit" className="btn btn-primary">Опубликовать</button>
          </form>
        </section>
      ) : can_suggest_news ? <SuggestedNewsForm /> : null}
      <div className="news-list">
        {news_items.map((item) => (
          <article className="placeholder-card news-card news-card-editorial" key={item.id}>
            <div className="news-card-header">
              <div className="news-meta"><span>{item.author_name}</span><span>{formatDateTime(item.created_at)}</span></div>
              <h3>{item.title}</h3>
            </div>
            {item.media && item.media.length ? (
              <div className="news-card-media-shell">
                <NewsMedia media={item.media} title={item.title} />
              </div>
            ) : null}
            <div className="news-body-panel">
              <p className="news-content">{item.content}</p>
            </div>
            <div className="news-comments news-comments-shell">
              <h4>Комментарии</h4>
              {item.comments && item.comments.length ? item.comments.map((comment) => (
                <NewsCommentItem key={comment.id} comment={comment} newsId={item.id} currentUserId={user?.id} canManageNews={can_manage_news} />
              )) : <p className="news-empty">Комментариев пока нет.</p>}
              <form method="POST" action="/news/comment" className="news-comment-form" id={`news-comment-form-${item.id}`}>
                <input type="hidden" name="news_id" value={item.id} />
                <textarea className="form-control mb-2" name="comment" rows="3" placeholder="Напишите комментарий" required />
              </form>
              <div className="news-card-actions">
                <button type="submit" form={`news-comment-form-${item.id}`} className="btn btn-outline-light">Отправить комментарий</button>
                {can_manage_news ? <NewsDeleteForm newsId={item.id} /> : null}
                {can_manage_news ? <NewsEditBlock item={item} /> : null}
              </div>
            </div>
          </article>
        ))}
        {!news_items.length ? <section className="placeholder-card"><h3>Новостей пока нет</h3><p>Опубликованные новости отображаются здесь.</p></section> : null}
      </div>
    </div>
  );
}

export function SuggestedNewsPage({ suggested_news_items = [], can_review_suggested_news = false }) {
  const heroDescription = can_review_suggested_news
    ? "Здесь администратор просматривает новости на рассмотрении, редактирует их, публикует или отклоняет."
    : "Здесь вы можете смотреть статус своих предложенных новостей, редактировать их и удалять при необходимости.";
  const emptyTitle = can_review_suggested_news ? "Предложенных новостей нет" : "У вас пока нет предложенных новостей";
  const emptyDescription = can_review_suggested_news
    ? "Когда пользователи отправят новости на рассмотрение, они появятся здесь."
    : "Отправленные вами новости на рассмотрение будут отображаться здесь.";

  return (
    <div className="section-page news-page news-suggestions-page ceremonial-page">
      <Hero title="Предложенные новости" description={heroDescription} />
      <div className="news-list">
        {suggested_news_items.map((item) => (
          <article className={`placeholder-card news-card news-card-editorial${item.review_status === "rejected" ? " is-rejected" : ""}`} key={item.id}>
            <div className="news-card-header">
              <div className="news-meta">
                <span>{item.author_name}</span>
                <span>{formatDateTime(item.created_at)}</span>
              </div>
              <div className={getSuggestedNewsStatusClassName(item.review_status)}>{getSuggestedNewsStatusLabel(item.review_status)}</div>
              <h3>{item.title}</h3>
            </div>
            {item.media && item.media.length ? (
              <div className="news-card-media-shell">
                <NewsMedia media={item.media} title={item.title} />
              </div>
            ) : null}
            <div className="news-body-panel">
              <p className="news-content">{item.content}</p>
              {item.review_comment ? (
                <div className="news-review-note">
                  <div className="news-review-note-title">Комментарий администратора</div>
                  <div className="news-review-comment">{item.review_comment}</div>
                </div>
              ) : null}
            </div>
            <div className="news-card-actions news-suggestion-actions">
              {can_review_suggested_news ? (
                <form method="POST" action="/news/publish">
                  <input type="hidden" name="news_id" value={item.id} />
                  <button type="submit" className="btn btn-primary">Опубликовать</button>
                </form>
              ) : null}
              <NewsDeleteForm newsId={item.id} redirectTo="/news/suggestions" />
              {can_review_suggested_news ? <NewsRejectBlock newsId={item.id} /> : null}
              <NewsEditBlock item={item} summaryLabel="Подредактировать" redirectTo="/news/suggestions" />
            </div>
          </article>
        ))}
        {!suggested_news_items.length ? <section className="placeholder-card"><h3>{emptyTitle}</h3><p>{emptyDescription}</p></section> : null}
      </div>
    </div>
  );
}
