const HistoryPage = window.HistoryPage;

const bootstrap = window.__BOOTSTRAP__ || {};

function formatDateTime(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function uploadedPath(path) {
    if (!path) {
        return "";
    }

    return `/uploads/${String(path).replace(/^uploads\//, "")}`;
}

function FlashMessages({ messages }) {
    if (!messages || !messages.length) {
        return null;
    }

    return (
        <div className="mt-3">
            {messages.map((message, index) => (
                <div className="alert alert-info" key={`${message}-${index}`}>
                    {message}
                </div>
            ))}
        </div>
    );
}

function LoginMessages({ messages }) {
    if (!messages || !messages.length) {
        return null;
    }

    return (
        <>
            {messages.map((message, index) => (
                <p className="msg" key={`${message}-${index}`}>
                    {message}
                </p>
            ))}
        </>
    );
}

function Header({ user, activeSection, pendingNewsCount = 0 }) {
    if (!user) {
        return null;
    }

    const isAdmin = Boolean(user.isadmin);
    const menuItems = [
        { key: "home", href: "/home", label: "Главная" },
        { key: "studios", href: "/studios", label: "Студии" },
        { key: "history", href: "/history", label: "История и кодекс" },
        { key: "bonus", href: "/bonus", label: "Бонусная система" },
        { key: "bank", href: "/teams", label: "Банк" },
    ];

    if (isAdmin) {
        menuItems.push({ key: "approve", href: "/approve", label: "Подтверждение" });
    }

    return (
        <div className="container-fluid text-center" id="header">
            <div className="row header white cartheader">
                <div className="header-topbar">
                    <div className="menu-toolbar">
                        <button
                            className="btn menu-toggle-button"
                            id="menuToggleButton"
                            type="button"
                            aria-expanded="false"
                            aria-controls="mainMenuCollapse"
                        >
                            Меню
                        </button>
                    </div>

                    <div className="menu-collapse" id="mainMenuCollapse">
                        <ul className="nav section-nav" id="main-sections">
                            {menuItems.map((item) => (
                                <li className="nav-item main-nav-item" key={item.key}>
                                    <a
                                        className={`nav-link ${activeSection === item.key ? "active" : ""} ${item.badgeCount ? "has-badge" : ""}`.trim()}
                                        href={item.href}
                                    >
                                        {item.label}
                                        {item.badgeCount ? <span className="nav-link-badge">{item.badgeCount}</span> : null}
                                    </a>
                                </li>
                            ))}
                            <li className="nav-item menu-extra-item">
                                <a className="nav-link" href="/logout">Выход</a>
                            </li>
                        </ul>
                        <ul className="nav menu-account-controls" id="user-controls">
                            <li className="nav-item user-status-item">
                                <div className="user-status-panel">{user.view}</div>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="/logout">Выход</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoginPage({ messages }) {
    return (
        <div className="container-fluid text-center">
            <div className="row header white"></div>

            <div className="row justify-content-center align-items-center login-layout">
                <div className="col-10 col-sm-8 col-md-5 col-lg-4 text-center">
                    <img
                        src="/static/logo.png"
                        title="logo"
                        alt="logo"
                        width="220"
                        height="220"
                        className="img-fluid login-logo"
                    />
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

function Hero({ title, description, extraClass = "" }) {
    return (
        <div className={`placeholder-hero ${extraClass}`.trim()}>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
        </div>
    );
}

function HomePage() {
    const cards = [
        {
            href: "/leaderboard",
            title: "Таблица лидеров",
            text: "Здесь отображаются две таблицы: дуэльный зачет и общий рейтинг легионов.",
        },
        {
            href: "/news",
            title: "Новости",
            text: "Здесь публикуются новости с изображениями и видео, а пользователи добавляют комментарии.",
        },
        {
            href: "/missions",
            title: "Миссии за валюту",
            text: "Здесь легионы выбирают задания, видят лимиты по контрактам и отправляют выполнение на подтверждение.",
        },
    ];

    return (
        <div className="section-page">
            <Hero
                title="Главная страница"
                description="Здесь отображаются основные разделы системы: таблица лидеров, новости и миссии за валюту."
            />

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
                            <tr>
                                <th>ЛЕГИОН</th>
                                <th>Очки</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`${row.Name}-${index}`}>
                                    <td>{row.Name}</td>
                                    <td>{row.Scores}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

function LeaderboardPage({ overall_leaderboard = [], duel_leaderboard = [] }) {
    return (
        <div className="section-page leaderboard-page">
            <Hero
                title="Таблица лидеров"
                description="Здесь отображаются отдельные таблицы общего рейтинга и дуэльных очков."
                extraClass="leaderboard-hero"
            />

            <div className="leaderboard-grid">
                <LeaderboardTable title="Очки влияния" rows={overall_leaderboard} />
                <LeaderboardTable title="Турнирные очки" rows={duel_leaderboard} />
            </div>
        </div>
    );
}

function NewsMedia({ media, title }) {
    if (!media || !media.length) {
        return null;
    }

    return (
        <div className="news-media-list">
            {media.map((item, index) => (
                item.media_type === "video" ? (
                    <video className="news-video" controls preload="metadata" key={`${item.media_path}-${index}`}>
                        <source src={uploadedPath(item.media_path)} />
                        Ваш браузер не поддерживает встроенное видео.
                    </video>
                ) : (
                    <img
                        className="news-image"
                        src={uploadedPath(item.media_path)}
                        alt={title}
                        key={`${item.media_path}-${index}`}
                    />
                )
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
                                            <video className="news-edit-media-preview" controls preload="metadata">
                                                <source src={uploadedPath(media.media_path)} />
                                            </video>
                                        ) : (
                                            <img className="news-edit-media-preview" src={uploadedPath(media.media_path)} alt={item.title} />
                                        )}
                                        <span className="news-edit-media-meta">
                                            {media.media_type === "video" ? "Видео" : "Изображение"}
                                        </span>
                                        <span className="news-edit-remove">
                                            <input type="checkbox" name="remove_media_ids" value={media.id} />
                                            <span>Убрать из новости</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="mb-3">
                        <label className="form-label" htmlFor={`edit-media-${item.id}`}>Добавить медиа</label>
                        <input
                            className="form-control"
                            id={`edit-media-${item.id}`}
                            name="media"
                            type="file"
                            accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v"
                            multiple
                        />
                        <div className="form-text text-light">Всего в новости можно оставить до 3 файлов.</div>
                    </div>

                    <button type="submit" className="btn btn-primary">Сохранить изменения</button>
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
                        <div className="mb-3">
                            <label className="form-label" htmlFor="suggest-title">Заголовок</label>
                            <input className="form-control" id="suggest-title" name="title" type="text" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="suggest-content">Текст новости</label>
                            <textarea className="form-control" id="suggest-content" name="content" rows="5" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="suggest-media">Медиафайлы</label>
                            <input className="form-control" id="suggest-media" name="media" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v" multiple />
                            <div className="form-text text-light">До 3 файлов: изображения или видео.</div>
                        </div>
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
            <summary className="news-reply-summary">{"\u041e\u0442\u0432\u0435\u0442\u0438\u0442\u044c"}</summary>
            <div className="news-edit-body">
                <form method="POST" action="/news/comment" className="news-reply-form">
                    <input type="hidden" name="news_id" value={newsId} />
                    <input type="hidden" name="parent_comment_id" value={comment.id} />
                    <textarea className="form-control mb-2" name="comment" rows="3" placeholder={"\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u043e\u0442\u0432\u0435\u0442"} required />
                    <button type="submit" className="btn btn-outline-light">{"\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442"}</button>
                </form>
            </div>
        </details>
                {canDelete ? (
                    <form method="POST" action="/news/comment/delete" className="news-delete-comment-form">
                        <input type="hidden" name="comment_id" value={comment.id} />
                        <button type="submit" className="news-comment-action-link">{"\u0423\u0434\u0430\u043b\u0438\u0442\u044c"}</button>
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

function NewsPage({ news_items = [], can_manage_news = false, can_suggest_news = false, pending_news_count = 0, user = null }) {
    const pendingCount = Number(pending_news_count) || 0;

    return (
        <div className="section-page">
            <Hero
                title="Новости"
                description="Здесь публикуются новости проекта, изображения, видео и комментарии пользователей."
            />

            {can_manage_news ? (
                <div className="news-page-actions">
                    <a className="btn btn-outline-light news-suggestions-link" href="/news/suggestions">
                        Предложенные новости
                        {pendingCount ? <span className="news-page-badge">{pendingCount}</span> : null}
                    </a>
                </div>
            ) : null}

            {can_manage_news ? (
                <section className="placeholder-card news-form-card">
                    <h3>Добавить новость</h3>
                    <form method="POST" action="/news/add" encType="multipart/form-data">
                        <div className="mb-3">
                            <label className="form-label" htmlFor="title">Заголовок</label>
                            <input className="form-control" id="title" name="title" type="text" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="content">Текст новости</label>
                            <textarea className="form-control" id="content" name="content" rows="5" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="media">Медиафайлы</label>
                            <input className="form-control" id="media" name="media" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v" multiple />
                            <div className="form-text text-light">До 3 файлов: изображения или видео.</div>
                        </div>
                        <button type="submit" className="btn btn-primary">Опубликовать</button>
                    </form>
                </section>
            ) : can_suggest_news ? <SuggestedNewsForm /> : null}

            <div className="news-list">
                {news_items.map((item) => (
                    <article className="placeholder-card news-card" key={item.id}>
                        <div className="news-meta">
                            <span>{item.author_name}</span>
                            <span>{formatDateTime(item.created_at)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <NewsMedia media={item.media} title={item.title} />
                        <p className="news-content">{item.content}</p>

                        <div className="news-comments">
                            <h4>Комментарии</h4>
                            {item.comments && item.comments.length ? item.comments.map((comment) => (
                                <NewsCommentItem
                                    key={comment.id}
                                    comment={comment}
                                    newsId={item.id}
                                    currentUserId={user?.id}
                                    canManageNews={can_manage_news}
                                />
                            )) : <p className="news-empty">{"\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0435\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442."}</p>}

                            <form method="POST" action="/news/comment" className="news-comment-form" id={`news-comment-form-${item.id}`}>
                                <input type="hidden" name="news_id" value={item.id} />
                                <textarea className="form-control mb-2" name="comment" rows="3" placeholder="Напишите комментарий" required />
                            </form>

                            <div className="news-card-actions">
                                <button type="submit" form={`news-comment-form-${item.id}`} className="btn btn-outline-light">
                                    Отправить комментарий
                                </button>
                                {can_manage_news ? <NewsEditBlock item={item} /> : null}
                            </div>
                        </div>
                    </article>
                ))}

                {!news_items.length ? (
                    <section className="placeholder-card">
                        <h3>Новостей пока нет</h3>
                        <p>Опубликованные новости отображаются здесь.</p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function SuggestedNewsPage({ suggested_news_items = [] }) {
    return (
        <div className="section-page">
            <Hero
                title="Предложенные новости"
                description="Здесь администратор просматривает новости на рассмотрении, редактирует их, публикует или отклоняет."
            />

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

                {!suggested_news_items.length ? (
                    <section className="placeholder-card">
                        <h3>Предложенных новостей нет</h3>
                        <p>Когда пользователи отправят новости на рассмотрение, они появятся здесь.</p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function MissionsPage({ is_admin = false, can_take_missions = false, current_team_mission_count = 0, missions = [] }) {
    return (
        <div className="section-page">
            <Hero
                title="Миссии за валюту"
                description="Легион может взять до 3 заданий одновременно. На одно задание могут откликнуться не более 3 легионов."
            />

            {is_admin ? (
                <section className="placeholder-card mission-form-card">
                    <h3>Добавить задание</h3>
                    <form method="POST" action="/missions/add">
                        <div className="mb-3">
                            <label className="form-label" htmlFor="mission-title">Название задания</label>
                            <input className="form-control" id="mission-title" name="title" type="text" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="mission-description">Текст задания</label>
                            <textarea className="form-control" id="mission-description" name="description" rows="5" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="mission-reward">Награда</label>
                            <input className="form-control" id="mission-reward" name="reward" type="number" min="1" step="1" required />
                        </div>
                        <button type="submit" className="btn btn-primary">Опубликовать задание</button>
                    </form>
                </section>
            ) : (
                <div className="mission-limit-note">
                    {can_take_missions ? (
                        <>Активных заданий у Легиона: {current_team_mission_count} / 3</>
                    ) : (
                        <>Журналисты могут только просматривать задания и не могут их принимать.</>
                    )}
                </div>
            )}

            <div className="news-list">
                {missions.map((mission) => (
                    <article className="placeholder-card mission-card" key={mission.id}>
                        <div className="news-meta">
                            <span>{mission.author_name}</span>
                            <span>{formatDateTime(mission.created_at)}</span>
                        </div>
                        <h3>{mission.title}</h3>
                        <p className="news-content">{mission.description}</p>
                        <div className="mission-info">
                            <span>Награда: {mission.reward} GRZ</span>
                            <span>Откликнулось легионов: {mission.accepted_count} / 3</span>
                        </div>
                        {mission.accepted_teams && mission.accepted_teams.length ? (
                            <div className="mission-teams">
                                Приняли задание: {mission.accepted_teams.join(", ")}
                            </div>
                        ) : null}

                        {is_admin ? (
                            <div className="mission-actions mission-admin-actions">
                                <form method="POST" action="/missions/delete" onSubmit={(event) => { if (!window.confirm("\u0412\u044b \u0443\u0432\u0435\u0440\u0435\u043d\u044b?")) { event.preventDefault(); } }}>
                                    <input type="hidden" name="mission_id" value={mission.id} />
                                    <button type="submit" className="btn btn-outline-light">Удалить миссию</button>
                                </form>
                            </div>
                        ) : can_take_missions ? (
                            mission.user_has_taken ? (
                                <div className="mission-actions">
                                    <div className="mission-status-note">Задание уже выбрано вашим Легионом</div>
                                    <form method="POST" action="/missions/cancel">
                                        <input type="hidden" name="mission_id" value={mission.id} />
                                        <button type="submit" className="btn btn-outline-light">Отказаться от задания</button>
                                    </form>
                                </div>
                            ) : mission.accepted_count >= 3 ? (
                                <button type="button" className="btn btn-secondary" disabled>Лимит легионов достигнут</button>
                            ) : current_team_mission_count >= 3 ? (
                                <button type="button" className="btn btn-secondary" disabled>Легион уже взял 3 задания</button>
                            ) : (
                                <div className="mission-actions">
                                    <form method="POST" action="/missions/accept">
                                        <input type="hidden" name="mission_id" value={mission.id} />
                                        <button type="submit" className="btn btn-primary">Принять задание</button>
                                    </form>
                                </div>
                            )
                        ) : (
                            <button type="button" className="btn btn-secondary" disabled>Журналист не может принимать задания</button>
                        )}
                    </article>
                ))}

                {!missions.length ? (
                    <section className="placeholder-card">
                        <h3>Заданий пока нет</h3>
                        <p>Добавленные администратором задания отображаются здесь.</p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function AdminBankView({ scoreboard = [] }) {
    return (
        <div className="row content">
            <div className="scoreboard-panel bank-scoreboard-panel">
                <div className="placeholder-hero section-title-panel bank-scoreboard-hero">
                    <h1>ГЕРЦЫ ЛЕГИОНОВ</h1>
                </div>

                <section className="placeholder-card table-card bank-table-card">
                    <div className="table-responsive bank-table-responsive">
                        <table className="table elegant-table bank-table bank-scoreboard-table">
                            <thead>
                                <tr>
                                    <th>ЛЕГИОН</th>
                                    <th>Итого:</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scoreboard.map((row, index) => (
                                    <tr key={`${row.Name}-${index}`}>
                                        <td data-label="Легион">{row.Name}</td>
                                        <td data-label="Итого">{row.Scores}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

function UserBankView({ current_plt }) {
    return (
        <h3>
            ГЕРЦЫ ТВОЕГО ЛЕГИОНА: <span className="badge text-bg-success">{current_plt}</span>
        </h3>
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
            <div className="bank-action-bar">
                <button
                    type="button"
                    className="btn btn-primary bank-action-button"
                    data-bs-toggle="modal"
                    data-bs-target="#exampleModal"
                >
                    Отправить герцы легиону
                </button>
            </div>

            <div className="modal fade" id="exampleModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <form method="POST" action="/api/add_operation">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5" id="exampleModalLabel">Форма отправки герцев</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                            </div>

                            <div className="modal-body">
                                {!is_admin ? (
                                    <input name="parent" type="hidden" id="parent" value={current_team_id || ""} />
                                ) : (
                                    <>
                                        <label htmlFor="userSRC">Выберите легион отправителя:</label>
                                        <select className="form-control" id="userSRC" name="parent" defaultValue={defaultSourceId}>
                                            {teams_for_select.map((team) => (
                                                <option key={`src-${team.id}`} value={team.id} data-balance={team.balance}>
                                                    {team.name}
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                )}

                                <label htmlFor="usersDST">Выберите легион получателя:</label>
                                <select className="form-control" id="usersDST" name="user" defaultValue={defaultTargetId}>
                                    {teams_for_select.map((team) => (
                                        <option key={`dst-${team.id}`} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>

                                <label htmlFor="PLT">Количество GRZ:</label>
                                <input
                                    name="score"
                                    type="number"
                                    min="0"
                                    max={defaultMax}
                                    step="1"
                                    defaultValue={defaultScore}
                                    id="PLT"
                                    className="form-control"
                                    placeholder="цена"
                                    disabled={!transferPossible && !is_admin}
                                />

                                <label htmlFor="comment">Комментарий:</label>
                                <input
                                    name="comment"
                                    type="text"
                                    className="form-control"
                                    id="comment"
                                    placeholder="Введите сообщение команде"
                                />

                                <div className="form-text" id="transferState">
                                    {!is_admin && current_plt <= 0 ? "Перевод недоступен: у текущего легиона нулевой баланс." : ""}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                                <button type="submit" className="btn btn-primary" id="transferSubmit" disabled={!transferPossible && !is_admin}>
                                    Отправить
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <div className="events-panel bank-operations-panel">
                <h3 className="events-title">Все события:</h3>
                <section className="placeholder-card table-card bank-table-card">
                    <div className="table-responsive bank-table-responsive">
                        <table className="table elegant-table bank-table bank-operations-table">
                            <thead>
                                <tr>
                                    <th>Период:</th>
                                    <th>Название легиона:</th>
                                    <th>Герцы:</th>
                                    <th>Коммент:</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operations.map((row, index) => (
                                    <tr key={`${row.Name}-${row.Period}-${index}`}>
                                        <td data-label="Период">{formatDate(row.Period)}</td>
                                        <td data-label="Легион">{row.Name}</td>
                                        <td data-label="Герцы">{row.Score}</td>
                                        <td data-label="Коммент">{row.Comment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}

function TeamsPage(props) {
    return (
        <div className="bank-page section-page">
            {props.is_admin ? <AdminBankView scoreboard={props.scoreboard} /> : <UserBankView current_plt={props.current_plt} />}
            <BankOperations {...props} />
        </div>
    );
}

function ApprovePage({ approve_items = [] }) {
    return (
        <div className="section-page">
            <Hero
                title="Подтверждение"
                description="Здесь администратор подтверждает или отклоняет выполнение принятых заданий. После подтверждения награда автоматически начисляется отряду."
            />

            <div className="news-list">
                {approve_items.map((item) => (
                    <article className="placeholder-card mission-card" key={item.id}>
                        <div className="news-meta">
                            <span>{item.team_name}</span>
                            <span>{formatDateTime(item.accepted_at)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="news-content">{item.description}</p>
                        <div className="mission-info">
                            <span>Отряд: {item.team_name}</span>
                            <span>Награда: {item.reward} GRZ</span>
                        </div>
                        <div className="approve-actions">
                            <form method="POST" action="/approve/confirm">
                                <input type="hidden" name="assignment_id" value={item.id} />
                                <button type="submit" className="btn btn-primary">Подтвердить выполнение</button>
                            </form>
                            <form method="POST" action="/approve/reject">
                                <input type="hidden" name="assignment_id" value={item.id} />
                                <button type="submit" className="btn btn-outline-light">Отклонить выполнение</button>
                            </form>
                        </div>
                    </article>
                ))}

                {!approve_items.length ? (
                    <section className="placeholder-card">
                        <h3>Нет заданий на подтверждение</h3>
                        <p>Принятые задания отображаются в этом списке.</p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function PlaceholderPage({ section_title, section_description }) {
    return (
        <div className="section-page">
            <Hero title={section_title} description={section_description} />
        </div>
    );
}

function AppLayout({ bootstrapData }) {
    const page = bootstrapData.page;

    React.useEffect(() => {
        if (typeof window.initMainUi === "function") {
            window.initMainUi();
        }
    }, [page, bootstrapData?.user?.id]);

    const renderPage = () => {
        switch (page) {
            case "login":
                return <LoginPage messages={bootstrapData.messages} />;
            case "home":
                return <HomePage />;
            case "history":
                return <HistoryPage />;
            case "leaderboard":
                return <LeaderboardPage {...bootstrapData} />;
            case "news":
                return <NewsPage {...bootstrapData} />;
            case "news_suggestions":
                return <SuggestedNewsPage {...bootstrapData} />;
            case "missions":
                return <MissionsPage {...bootstrapData} />;
            case "teams":
                return <TeamsPage {...bootstrapData} />;
            case "approve":
                return <ApprovePage {...bootstrapData} />;
            case "placeholder":
                return <PlaceholderPage {...bootstrapData} />;
            default:
                return (
                    <div className="section-page">
                        <section className="placeholder-card">
                            <h3>Страница не найдена</h3>
                        </section>
                    </div>
                );
        }
    };

    if (page === "login") {
        return renderPage();
    }

    return (
        <>
            <Header
                user={bootstrapData.user}
                activeSection={bootstrapData.activeSection}
                pendingNewsCount={bootstrapData.pending_news_count}
            />
            <div className="container">
                <FlashMessages messages={bootstrapData.messages} />
                {renderPage()}
            </div>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<AppLayout bootstrapData={bootstrap} />);

window.requestAnimationFrame(function () {
    if (typeof window.initMainUi === "function") {
        window.initMainUi();
    }
});
