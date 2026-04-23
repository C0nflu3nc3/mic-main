import { Hero, LoginMessages, formatDateTime, uploadedPath } from "./shared";

export function LoginPage({ messages }) {
  return (
    <div className="container-fluid text-center">
      <div className="row header white"></div>

      <div className="row justify-content-center align-items-center login-layout">
        <div className="col-10 col-sm-8 col-md-5 col-lg-4 text-center">
          <img src="/static/logo.png" title="logo" alt="logo" width="220" height="220" className="img-fluid login-logo" />
        </div>

        <div className="col-11 col-sm-10 col-md-7 col-lg-4">
          <form action="/signin" method="post">
            <h1 className="text-center">Авторизация</h1>

            <div className="form-outline mb-4 text-start">
              <label className="form-label" htmlFor="login">Логин</label>
              <input type="text" name="login" id="login" className="form-control" placeholder="Введите свой логин" />
            </div>

            <div className="form-outline mb-4 text-start">
              <label className="form-label" htmlFor="password">Пароль</label>
              <input type="password" name="password" id="password" className="form-control" placeholder="Введите пароль" />
            </div>

            <LoginMessages messages={messages} />

            <button type="submit" className="btn btn-primary w-100 mb-4">Войти</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const cards = [
    { href: "/leaderboard", title: "Таблица лидеров", text: "Здесь отображаются две таблицы: дуэльный зачет и общий рейтинг легионов." },
    { href: "/news", title: "Новости", text: "Здесь публикуются новости с изображениями и видео, а пользователи добавляют комментарии." },
    { href: "/missions", title: "Миссии за валюту", text: "Здесь легионы выбирают задания, видят лимиты по контрактам и отправляют выполнение на подтверждение." }
  ];

  return (
    <div className="section-page">
      <Hero title="Главная страница" description="Здесь отображаются основные разделы системы: таблица лидеров, новости и миссии за валюту." />
      <div className="placeholder-grid">
        {cards.map((card) => (
          <section className="placeholder-card" key={card.href}>
            <a className="placeholder-card-link" href={card.href}>{card.title}</a>
            <p>{card.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function LeaderboardTable({ title, rows }) {
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
      </div>
    </section>
  );
}

export function LeaderboardPage({ overall_leaderboard = [], duel_leaderboard = [] }) {
  return (
    <div className="section-page leaderboard-page">
      <Hero title="Таблица лидеров" description="Здесь отображаются отдельные таблицы общего рейтинга и дуэльных очков." extraClass="leaderboard-hero" />
      <div className="leaderboard-grid">
        <LeaderboardTable title="Очки влияния" rows={overall_leaderboard} />
        <LeaderboardTable title="Турнирные очки" rows={duel_leaderboard} />
      </div>
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
        <img className="news-image" src={uploadedPath(item.media_path)} alt={title} key={`${item.media_path}-${index}`} />
      ))}
    </div>
  );
}

function NewsEditBlock({ item, summaryLabel = "Редактировать новость", redirectTo = "" }) {
  return (
    <details className="news-edit-block news-edit-action">
      <summary className="news-edit-summary">{summaryLabel}</summary>
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
                    <img className="news-edit-media-preview" src={uploadedPath(media.media_path)} alt={item.title} />
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
    </details>
  );
}

function SuggestedNewsForm() {
  return (
    <section className="placeholder-card news-form-card">
      <details className="news-edit-block news-suggest-block" open={false}>
        <summary className="news-edit-summary">Предложить новость</summary>
        <form method="POST" action="/news/suggest" encType="multipart/form-data" className="news-edit-form">
          <div className="mb-3"><label className="form-label" htmlFor="suggest-title">Заголовок</label><input className="form-control" id="suggest-title" name="title" type="text" required /></div>
          <div className="mb-3"><label className="form-label" htmlFor="suggest-content">Текст новости</label><textarea className="form-control" id="suggest-content" name="content" rows="5" required /></div>
          <div className="mb-3"><label className="form-label" htmlFor="suggest-media">Медиафайлы</label><input className="form-control" id="suggest-media" name="media" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v" multiple /><div className="form-text text-light">До 3 файлов: изображения или видео.</div></div>
          <button type="submit" className="btn btn-primary">Отправить на рассмотрение</button>
        </form>
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
        <details className="news-reply-block">
          <summary className="news-reply-summary">Ответить</summary>
          <form method="POST" action="/news/comment" className="news-reply-form">
            <input type="hidden" name="news_id" value={newsId} />
            <input type="hidden" name="parent_comment_id" value={comment.id} />
            <textarea className="form-control mb-2" name="comment" rows="3" placeholder="Напишите ответ" required />
            <button type="submit" className="btn btn-outline-light">Отправить ответ</button>
          </form>
        </details>
        {canDelete ? (
          <form method="POST" action="/news/comment/delete" className="news-delete-comment-form">
            <input type="hidden" name="comment_id" value={comment.id} />
            <button type="submit" className="btn btn-outline-light">Удалить</button>
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

export function NewsPage({ news_items = [], can_manage_news = false, can_suggest_news = false, user = null }) {
  return (
    <div className="section-page">
      <Hero title="Новости" description="Здесь публикуются новости проекта, изображения, видео и комментарии пользователей." />
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
          <article className="placeholder-card news-card" key={item.id}>
            <div className="news-meta"><span>{item.author_name}</span><span>{formatDateTime(item.created_at)}</span></div>
            <h3>{item.title}</h3>
            <NewsMedia media={item.media} title={item.title} />
            <p className="news-content">{item.content}</p>
            <div className="news-comments">
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

export function SuggestedNewsPage({ suggested_news_items = [] }) {
  return (
    <div className="section-page">
      <Hero title="Предложенные новости" description="Здесь администратор просматривает новости на рассмотрении, редактирует их, публикует или отклоняет." />
      <div className="news-list">
        {suggested_news_items.map((item) => (
          <article className="placeholder-card news-card" key={item.id}>
            <div className="news-meta">
              <span>{item.author_name}</span>
              <span>{formatDateTime(item.created_at)}</span>
            </div>
            <div className="news-suggestion-status">На рассмотрении</div>
            <h3>{item.title}</h3>
            <NewsMedia media={item.media} title={item.title} />
            <p className="news-content">{item.content}</p>
            <div className="news-card-actions news-suggestion-actions">
              <form method="POST" action="/news/publish">
                <input type="hidden" name="news_id" value={item.id} />
                <button type="submit" className="btn btn-primary">Опубликовать</button>
              </form>
              <form method="POST" action="/news/reject">
                <input type="hidden" name="news_id" value={item.id} />
                <button type="submit" className="btn btn-outline-light">Отклонить</button>
              </form>
              <NewsEditBlock item={item} summaryLabel="Подредактировать" redirectTo="/news/suggestions" />
            </div>
          </article>
        ))}
        {!suggested_news_items.length ? <section className="placeholder-card"><h3>Предложенных новостей нет</h3><p>Когда пользователи отправят новости на рассмотрение, они появятся здесь.</p></section> : null}
      </div>
    </div>
  );
}
