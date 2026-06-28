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
        { key: "home", href: "/home", label: "Р“Р»Р°РІРЅР°СЏ" },
        { key: "studios", href: "/studios", label: "Гильдии" },
        { key: "history", href: "/history", label: "РСЃС‚РѕСЂРёСЏ Рё РєРѕРґРµРєСЃ" },
        { key: "bonus", href: "/bonus", label: "Р‘РѕРЅСѓСЃРЅР°СЏ СЃРёСЃС‚РµРјР°" },
        { key: "bank", href: "/teams", label: "Р‘Р°РЅРє" },
    ];

    if (isAdmin) {
        menuItems.push({ key: "approve", href: "/approve", label: "РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ" });
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
                            РњРµРЅСЋ
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
                                <form method="POST" action="/logout" className="nav-link-form">
                                    <button type="submit" className="nav-link nav-link-button">Р’С‹С…РѕРґ</button>
                                </form>
                            </li>
                        </ul>
                        <ul className="nav menu-account-controls" id="user-controls">
                            <li className="nav-item user-status-item">
                                <div className="user-status-panel">{user.view}</div>
                            </li>
                            <li className="nav-item">
                                <form method="POST" action="/logout" className="nav-link-form">
                                    <button type="submit" className="nav-link nav-link-button">Р’С‹С…РѕРґ</button>
                                </form>
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


            <div className="row justify-content-center align-items-center login-layout auth-page">
                <div className="col-11 col-sm-9 col-md-5 col-lg-5 d-flex justify-content-center login-brand-col">
                    <div className="logo-panel">
                        <span className="logo-orbit" aria-hidden="true" />
                        <img
                            src="/static/logo_login.png"
                            title="logo"
                            alt="logo"
                            width="220"
                            height="220"
                            className="img-fluid login-logo"
                            decoding="async"
                        />
                    </div>
                </div>

                <div className="col-11 col-sm-10 col-md-7 col-lg-5 login-form-col">
                    <form action="/signin" method="post" className="login-card">
                        <div className="login-card-divider login-card-divider-top" aria-hidden="true" />
                        <h1 className="text-center">РђРІС‚РѕСЂРёР·Р°С†РёСЏ</h1>
                        <div className="login-card-divider" aria-hidden="true" />

                        <div className="form-outline mb-4 text-start login-field login-field-user">
                            <label className="form-label" htmlFor="login">Р›РѕРіРёРЅ</label>
                            <input type="text" name="login" id="login" className="form-control" placeholder="Р’РІРµРґРёС‚Рµ СЃРІРѕР№ Р»РѕРіРёРЅ" />
                        </div>

                        <div className="form-outline mb-4 text-start login-field login-field-pass">
                            <label className="form-label" htmlFor="password">РџР°СЂРѕР»СЊ</label>
                            <input type="password" name="password" id="password" className="form-control" placeholder="Р’РІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ" />
                        </div>

                        <LoginMessages messages={messages} />

                        <button type="submit" className="btn btn-primary w-100 mb-4">Р’РѕР№С‚Рё</button>
                        <div className="login-card-divider login-card-divider-bottom" aria-hidden="true" />
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
            icon: "рџЏ†",
            variant: "leaderboard",
            title: "РўР°Р±Р»РёС†Р° Р»РёРґРµСЂРѕРІ",
            text: "Р—РґРµСЃСЊ РѕС‚РѕР±СЂР°Р¶Р°СЋС‚СЃСЏ РґРІРµ С‚Р°Р±Р»РёС†С‹: РґСѓСЌР»СЊРЅС‹Р№ Р·Р°С‡РµС‚ Рё РѕР±С‰РёР№ СЂРµР№С‚РёРЅРі Р»РµРіРёРѕРЅРѕРІ.",
        },
        {
            href: "/news",
            icon: "рџ“њ",
            variant: "news",
            title: "РќРѕРІРѕСЃС‚Рё",
            text: "Р—РґРµСЃСЊ РїСѓР±Р»РёРєСѓСЋС‚СЃСЏ РЅРѕРІРѕСЃС‚Рё СЃ РёР·РѕР±СЂР°Р¶РµРЅРёСЏРјРё Рё РІРёРґРµРѕ, Р° РїРѕР»СЊР·РѕРІР°С‚РµР»Рё РґРѕР±Р°РІР»СЏСЋС‚ РєРѕРјРјРµРЅС‚Р°СЂРёРё.",
        },
        {
            href: "/missions",
            icon: "вњ¦",
            variant: "missions",
            title: "Р”РѕСЃРєР° Р·Р°РєР°Р·РѕРІ",
            text: "Р—РґРµСЃСЊ Р»РµРіРёРѕРЅС‹ РІС‹Р±РёСЂР°СЋС‚ Р·Р°РґР°РЅРёСЏ, РІРёРґСЏС‚ Р»РёРјРёС‚С‹ РїРѕ РєРѕРЅС‚СЂР°РєС‚Р°Рј Рё РѕС‚РїСЂР°РІР»СЏСЋС‚ РІС‹РїРѕР»РЅРµРЅРёРµ РЅР° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ.",
        },
    ];

    return (
        <div className="section-page home-page ceremonial-page">
            <Hero
                title="Р“Р»Р°РІРЅР°СЏ СЃС‚СЂР°РЅРёС†Р°"
                description="Р—РґРµСЃСЊ РѕС‚РѕР±СЂР°Р¶Р°СЋС‚СЃСЏ РѕСЃРЅРѕРІРЅС‹Рµ СЂР°Р·РґРµР»С‹ СЃРёСЃС‚РµРјС‹: С‚Р°Р±Р»РёС†Р° Р»РёРґРµСЂРѕРІ, РЅРѕРІРѕСЃС‚Рё Рё РјРёСЃСЃРёРё Р·Р° РІР°Р»СЋС‚Сѓ."
            />

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
    return (
        <details className="news-edit-block is-collapsed">
            <summary className="news-edit-summary">Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ С‚Р°Р±Р»РёС†Сѓ</summary>
            <div className="news-edit-body">
                {rows.map((row, index) => (
                    <form method="POST" action="/leaderboard/update" className="news-edit-form" key={`${tableName}-${row.user_id}-${index}`}>
                        <input type="hidden" name="table_name" value={tableName} />
                        <input type="hidden" name="user_id" value={row.user_id} />
                        <div className="mb-3">
                            <label className="form-label" htmlFor={`${tableName}-name-${row.user_id}`}>РќР°Р·РІР°РЅРёРµ</label>
                            <input className="form-control" id={`${tableName}-name-${row.user_id}`} name="name" type="text" defaultValue={row.Name} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor={`${tableName}-score-${row.user_id}`}>РћС‡РєРё</label>
                            <input className="form-control" id={`${tableName}-score-${row.user_id}`} name="score" type="number" defaultValue={row.Scores} required />
                        </div>
                        <button type="submit" className="btn btn-primary">РЎРѕС…СЂР°РЅРёС‚СЊ СЃС‚СЂРѕРєСѓ</button>
                    </form>
                ))}
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
                            <tr>
                                <th>Р›Р•Р“РРћРќ</th>
                                <th>РћС‡РєРё</th>
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
                {canManageLeaderboards ? <LeaderboardEditBlock tableName={tableName} rows={rows} /> : null}
            </div>
        </section>
    );
}

function LeaderboardPage({ overall_leaderboard = [], duel_leaderboard = [], can_manage_leaderboards = false, leaderboard_hidden_for_users = false }) {
    return (
        <div className="section-page leaderboard-page ceremonial-page">
            <Hero
                title="РўР°Р±Р»РёС†Р° Р»РёРґРµСЂРѕРІ"
                description="Р—РґРµСЃСЊ РѕС‚РѕР±СЂР°Р¶Р°СЋС‚СЃСЏ РѕС‚РґРµР»СЊРЅС‹Рµ С‚Р°Р±Р»РёС†С‹ РѕР±С‰РµРіРѕ СЂРµР№С‚РёРЅРіР° Рё РґСѓСЌР»СЊРЅС‹С… РѕС‡РєРѕРІ."
                extraClass="leaderboard-hero"
            />
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
                    <LeaderboardTable title="РћС‡РєРё РІР»РёСЏРЅРёСЏ" rows={overall_leaderboard} tableName="Overall_leader" canManageLeaderboards={can_manage_leaderboards} />
                    <LeaderboardTable title="РўСѓСЂРЅРёСЂРЅС‹Рµ РѕС‡РєРё" rows={duel_leaderboard} tableName="Duel_leader" canManageLeaderboards={can_manage_leaderboards} />
                </div>
            )}
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
                        Р’Р°С€ Р±СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ РІСЃС‚СЂРѕРµРЅРЅРѕРµ РІРёРґРµРѕ.
                    </video>
                ) : (
                    <img
                        className="news-image"
                        src={uploadedPath(item.media_path)}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        key={`${item.media_path}-${index}`}
                    />
                )
            ))}
        </div>
    );
}

function NewsEditBlock({ item, summaryLabel = "Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РЅРѕРІРѕСЃС‚СЊ", redirectTo = "" }) {
    return (
        <details className="news-edit-block news-edit-action is-collapsed">
            <summary className="news-edit-summary">{summaryLabel}</summary>
            <div className="news-edit-body">
                <form method="POST" action="/news/update" encType="multipart/form-data" className="news-edit-form">
                    <input type="hidden" name="news_id" value={item.id} />
                    {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}

                    <div className="mb-3">
                        <label className="form-label" htmlFor={`edit-title-${item.id}`}>Р—Р°РіРѕР»РѕРІРѕРє</label>
                        <input className="form-control" id={`edit-title-${item.id}`} name="title" type="text" defaultValue={item.title} required />
                    </div>

                    <div className="mb-3">
                        <label className="form-label" htmlFor={`edit-content-${item.id}`}>РўРµРєСЃС‚ РЅРѕРІРѕСЃС‚Рё</label>
                        <textarea className="form-control" id={`edit-content-${item.id}`} name="content" rows="5" defaultValue={item.content} required />
                    </div>

                    {item.media && item.media.length ? (
                        <div className="mb-3">
                            <div className="form-label">РўРµРєСѓС‰РёРµ РјРµРґРёР°</div>
                            <div className="news-edit-existing-media">
                                {item.media.map((media, index) => (
                                    <label className="news-edit-media-item" key={`${media.media_path}-${index}`}>
                                        {media.media_type === "video" ? (
                                            <video className="news-edit-media-preview" controls preload="metadata">
                                                <source src={uploadedPath(media.media_path)} />
                                            </video>
                                        ) : (
                                            <img className="news-edit-media-preview" src={uploadedPath(media.media_path)} alt={item.title} loading="lazy" decoding="async" />
                                        )}
                                        <span className="news-edit-media-meta">
                                            {media.media_type === "video" ? "Р’РёРґРµРѕ" : "РР·РѕР±СЂР°Р¶РµРЅРёРµ"}
                                        </span>
                                        <span className="news-edit-remove">
                                            <input type="checkbox" name="remove_media_ids" value={media.id} />
                                            <span>РЈР±СЂР°С‚СЊ РёР· РЅРѕРІРѕСЃС‚Рё</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="mb-3">
                        <label className="form-label" htmlFor={`edit-media-${item.id}`}>Р”РѕР±Р°РІРёС‚СЊ РјРµРґРёР°</label>
                        <input
                            className="form-control"
                            id={`edit-media-${item.id}`}
                            name="media"
                            type="file"
                            accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v"
                            multiple
                        />
                        <div className="form-text text-light">Р’СЃРµРіРѕ РІ РЅРѕРІРѕСЃС‚Рё РјРѕР¶РЅРѕ РѕСЃС‚Р°РІРёС‚СЊ РґРѕ 3 С„Р°Р№Р»РѕРІ.</div>
                    </div>

                    <button type="submit" className="btn btn-primary">РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ</button>
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
                if (!window.confirm("РЈРґР°Р»РёС‚СЊ РЅРѕРІРѕСЃС‚СЊ?")) {
                    event.preventDefault();
                }
            }}
        >
            <input type="hidden" name="news_id" value={newsId} />
            {redirectTo ? <input type="hidden" name="redirect_to" value={redirectTo} /> : null}
            <button type="submit" className="btn btn-outline-light">РЈРґР°Р»РёС‚СЊ РЅРѕРІРѕСЃС‚СЊ</button>
        </form>
    );
}

function SuggestedNewsForm() {
    return (
        <section className="placeholder-card news-form-card news-suggest-card">
            <details className="news-edit-block news-suggest-block is-collapsed">
                <summary className="news-edit-summary">РџСЂРµРґР»РѕР¶РёС‚СЊ РЅРѕРІРѕСЃС‚СЊ</summary>
                <div className="news-edit-body">
                    <form method="POST" action="/news/suggest" encType="multipart/form-data" className="news-edit-form">
                        <div className="mb-3">
                            <label className="form-label" htmlFor="suggest-title">Р—Р°РіРѕР»РѕРІРѕРє</label>
                            <input className="form-control" id="suggest-title" name="title" type="text" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="suggest-content">РўРµРєСЃС‚ РЅРѕРІРѕСЃС‚Рё</label>
                            <textarea className="form-control" id="suggest-content" name="content" rows="5" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="suggest-media">РњРµРґРёР°С„Р°Р№Р»С‹</label>
                            <input className="form-control" id="suggest-media" name="media" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v" multiple />
                            <div className="form-text text-light">Р”Рѕ 3 С„Р°Р№Р»РѕРІ: РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РёР»Рё РІРёРґРµРѕ.</div>
                        </div>
                        <button type="submit" className="btn btn-primary">РћС‚РїСЂР°РІРёС‚СЊ РЅР° СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРµ</button>
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
        <div className="section-page news-page ceremonial-page">
            <Hero
                title="РќРѕРІРѕСЃС‚Рё"
                description="Р—РґРµСЃСЊ РїСѓР±Р»РёРєСѓСЋС‚СЃСЏ РЅРѕРІРѕСЃС‚Рё РїСЂРѕРµРєС‚Р°, РёР·РѕР±СЂР°Р¶РµРЅРёСЏ, РІРёРґРµРѕ Рё РєРѕРјРјРµРЅС‚Р°СЂРёРё РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№."
            />

            {can_manage_news ? (
                <div className="news-page-actions">
                    <a className="btn btn-outline-light news-suggestions-link" href="/news/suggestions">
                        РџСЂРµРґР»РѕР¶РµРЅРЅС‹Рµ РЅРѕРІРѕСЃС‚Рё
                        {pendingCount ? <span className="news-page-badge">{pendingCount}</span> : null}
                    </a>
                </div>
            ) : null}

            {can_manage_news ? (
                <section className="placeholder-card news-form-card">
                    <h3>Р”РѕР±Р°РІРёС‚СЊ РЅРѕРІРѕСЃС‚СЊ</h3>
                    <form method="POST" action="/news/add" encType="multipart/form-data">
                        <div className="mb-3">
                            <label className="form-label" htmlFor="title">Р—Р°РіРѕР»РѕРІРѕРє</label>
                            <input className="form-control" id="title" name="title" type="text" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="content">РўРµРєСЃС‚ РЅРѕРІРѕСЃС‚Рё</label>
                            <textarea className="form-control" id="content" name="content" rows="5" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="media">РњРµРґРёР°С„Р°Р№Р»С‹</label>
                            <input className="form-control" id="media" name="media" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.webm,.ogg,.mov,.m4v" multiple />
                            <div className="form-text text-light">Р”Рѕ 3 С„Р°Р№Р»РѕРІ: РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РёР»Рё РІРёРґРµРѕ.</div>
                        </div>
                        <button type="submit" className="btn btn-primary">РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ</button>
                    </form>
                </section>
            ) : can_suggest_news ? <SuggestedNewsForm /> : null}

            <div className="news-list">
                {news_items.map((item) => (
                    <article className="placeholder-card news-card news-card-editorial" key={item.id}>
                        <div className="news-card-header">
                            <div className="news-meta">
                                <span>{item.author_name}</span>
                                <span>{formatDateTime(item.created_at)}</span>
                            </div>
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
                            <h4>РљРѕРјРјРµРЅС‚Р°СЂРёРё</h4>
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
                                <textarea className="form-control mb-2" name="comment" rows="3" placeholder="РќР°РїРёС€РёС‚Рµ РєРѕРјРјРµРЅС‚Р°СЂРёР№" required />
                    </form>

                            <div className="news-card-actions">
                                <button type="submit" form={`news-comment-form-${item.id}`} className="btn btn-outline-light">
                                    РћС‚РїСЂР°РІРёС‚СЊ РєРѕРјРјРµРЅС‚Р°СЂРёР№
                                </button>
                                {can_manage_news ? <NewsDeleteForm newsId={item.id} /> : null}
                                {can_manage_news ? <NewsEditBlock item={item} /> : null}
                            </div>
                        </div>
                    </article>
                ))}

                {!news_items.length ? (
                    <section className="placeholder-card">
                        <h3>РќРѕРІРѕСЃС‚РµР№ РїРѕРєР° РЅРµС‚</h3>
                        <p>РћРїСѓР±Р»РёРєРѕРІР°РЅРЅС‹Рµ РЅРѕРІРѕСЃС‚Рё РѕС‚РѕР±СЂР°Р¶Р°СЋС‚СЃСЏ Р·РґРµСЃСЊ.</p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function SuggestedNewsPage({ suggested_news_items = [] }) {
    return (
        <div className="section-page news-page news-suggestions-page ceremonial-page">
            <Hero
                title="РџСЂРµРґР»РѕР¶РµРЅРЅС‹Рµ РЅРѕРІРѕСЃС‚Рё"
                description="Р—РґРµСЃСЊ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ РїСЂРѕСЃРјР°С‚СЂРёРІР°РµС‚ РЅРѕРІРѕСЃС‚Рё РЅР° СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРё, СЂРµРґР°РєС‚РёСЂСѓРµС‚ РёС…, РїСѓР±Р»РёРєСѓРµС‚ РёР»Рё РѕС‚РєР»РѕРЅСЏРµС‚."
            />

            <div className="news-list">
                {suggested_news_items.map((item) => (
                    <article className="placeholder-card news-card news-card-editorial" key={item.id}>
                        <div className="news-card-header">
                            <div className="news-meta">
                                <span>{item.author_name}</span>
                                <span>{formatDateTime(item.created_at)}</span>
                            </div>
                            <div className="news-suggestion-status">РќР° СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРё</div>
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

                        <div className="news-card-actions news-suggestion-actions">
                            <form method="POST" action="/news/publish">
                                <input type="hidden" name="news_id" value={item.id} />
                                <button type="submit" className="btn btn-primary">РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ</button>
                    </form>
                            <NewsDeleteForm newsId={item.id} redirectTo="/news/suggestions" />
                            <form method="POST" action="/news/reject">
                                <input type="hidden" name="news_id" value={item.id} />
                                <button type="submit" className="btn btn-outline-light">РћС‚РєР»РѕРЅРёС‚СЊ</button>
                    </form>
                            <NewsEditBlock item={item} summaryLabel="РџРѕРґСЂРµРґР°РєС‚РёСЂРѕРІР°С‚СЊ" redirectTo="/news/suggestions" />
                        </div>
                    </article>
                ))}

                {!suggested_news_items.length ? (
                    <section className="placeholder-card">
                        <h3>РџСЂРµРґР»РѕР¶РµРЅРЅС‹С… РЅРѕРІРѕСЃС‚РµР№ РЅРµС‚</h3>
                        <p>РљРѕРіРґР° РїРѕР»СЊР·РѕРІР°С‚РµР»Рё РѕС‚РїСЂР°РІСЏС‚ РЅРѕРІРѕСЃС‚Рё РЅР° СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРµ, РѕРЅРё РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ.</p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function MissionEditBlock({ mission }) {
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
                        <label className="form-label" htmlFor={`mission-edit-reward-${mission.id}`}>Награда</label>
                        <input className="form-control" id={`mission-edit-reward-${mission.id}`} name="reward" type="number" min="1" step="1" defaultValue={mission.reward} required />
                    </div>
                    <div className="mb-3 form-check">
                        <input className="form-check-input" id={`mission-edit-exclusive-${mission.id}`} name="is_exclusive" type="checkbox" value="1" defaultChecked={Boolean(mission.is_exclusive)} />
                        <label className="form-check-label" htmlFor={`mission-edit-exclusive-${mission.id}`}>Эксклюзивное задание</label>
                    </div>
                    <div className="mb-3">
                        <label className="form-label" htmlFor={`mission-edit-max-accepted-${mission.id}`}>Лимит откликов</label>
                        <input className="form-control" id={`mission-edit-max-accepted-${mission.id}`} name="max_accepted_count" type="number" min="1" step="1" defaultValue={mission.max_accepted_count || 3} required />
                    </div>
                    <button type="submit" className="btn btn-primary">Сохранить изменения</button>
                </form>
            </div>
        </details>
    );
}

function MissionsPage({ is_admin = false, can_take_missions = false, current_team_mission_count = 0, missions = [] }) {
    return (
        <div className="section-page missions-page ceremonial-page">
            <Hero
                title="Р”РѕСЃРєР° Р·Р°РєР°Р·РѕРІ"
                description="Р›РµРіРёРѕРЅ РјРѕР¶РµС‚ РІР·СЏС‚СЊ РґРѕ 3 Р·Р°РґР°РЅРёР№ РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ. РќР° РѕРґРЅРѕ Р·Р°РґР°РЅРёРµ РјРѕРіСѓС‚ РѕС‚РєР»РёРєРЅСѓС‚СЊСЃСЏ РЅРµ Р±РѕР»РµРµ 3 Р»РµРіРёРѕРЅРѕРІ."
            />

            {is_admin ? (
                <section className="placeholder-card mission-form-card">
                    <h3>Р”РѕР±Р°РІРёС‚СЊ Р·Р°РґР°РЅРёРµ</h3>
                    <form method="POST" action="/missions/add">
                        <div className="mb-3">
                            <label className="form-label" htmlFor="mission-title">РќР°Р·РІР°РЅРёРµ Р·Р°РґР°РЅРёСЏ</label>
                            <input className="form-control" id="mission-title" name="title" type="text" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="mission-description">РўРµРєСЃС‚ Р·Р°РґР°РЅРёСЏ</label>
                            <textarea className="form-control" id="mission-description" name="description" rows="5" required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="mission-reward">РќР°РіСЂР°РґР°</label>
                            <input className="form-control" id="mission-reward" name="reward" type="number" min="1" step="1" required />
                        </div>
                        <button type="submit" className="btn btn-primary">РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ Р·Р°РґР°РЅРёРµ</button>
                    </form>
                </section>
            ) : (
                <div className="mission-limit-note">
                    {can_take_missions ? (
                        <>РђРєС‚РёРІРЅС‹С… Р·Р°РґР°РЅРёР№ Сѓ Р›РµРіРёРѕРЅР°: {current_team_mission_count} / 3</>
                    ) : (
                        <>Р–СѓСЂРЅР°Р»РёСЃС‚С‹ РјРѕРіСѓС‚ С‚РѕР»СЊРєРѕ РїСЂРѕСЃРјР°С‚СЂРёРІР°С‚СЊ Р·Р°РґР°РЅРёСЏ Рё РЅРµ РјРѕРіСѓС‚ РёС… РїСЂРёРЅРёРјР°С‚СЊ.</>
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
                            <span>РќР°РіСЂР°РґР°: {mission.reward} GRZ</span>
                            <span>РћС‚РєР»РёРєРЅСѓР»РѕСЃСЊ Р»РµРіРёРѕРЅРѕРІ: {mission.accepted_count} / 3</span>
                        </div>
                        {mission.accepted_teams && mission.accepted_teams.length ? (
                            <div className="mission-teams">
                                РџСЂРёРЅСЏР»Рё Р·Р°РґР°РЅРёРµ: {mission.accepted_teams.join(", ")}
                            </div>
                        ) : null}

                        {is_admin ? (
                            <div className="mission-actions mission-admin-actions">
                                <MissionEditBlock mission={mission} />
                                <form method="POST" action="/missions/delete" onSubmit={(event) => { if (!window.confirm("\u0412\u044b \u0443\u0432\u0435\u0440\u0435\u043d\u044b?")) { event.preventDefault(); } }}>
                                    <input type="hidden" name="mission_id" value={mission.id} />
                                    <button type="submit" className="btn btn-outline-light">РЈРґР°Р»РёС‚СЊ РјРёСЃСЃРёСЋ</button>
                    </form>
                            </div>
                        ) : can_take_missions ? (
                            mission.user_has_taken ? (
                                <div className="mission-actions">
                                    <div className="mission-status-note">Р—Р°РґР°РЅРёРµ СѓР¶Рµ РІС‹Р±СЂР°РЅРѕ РІР°С€РёРј Р›РµРіРёРѕРЅРѕРј</div>
                                    <form method="POST" action="/missions/cancel">
                                        <input type="hidden" name="mission_id" value={mission.id} />
                                        <button type="submit" className="btn btn-outline-light">РћС‚РєР°Р·Р°С‚СЊСЃСЏ РѕС‚ Р·Р°РґР°РЅРёСЏ</button>
                    </form>
                                </div>
                            ) : mission.accepted_count >= 3 ? (
                                <button type="button" className="btn btn-secondary" disabled>Р›РёРјРёС‚ Р»РµРіРёРѕРЅРѕРІ РґРѕСЃС‚РёРіРЅСѓС‚</button>
                            ) : current_team_mission_count >= 3 ? (
                                <button type="button" className="btn btn-secondary" disabled>Р›РµРіРёРѕРЅ СѓР¶Рµ РІР·СЏР» 3 Р·Р°РґР°РЅРёСЏ</button>
                            ) : (
                                <div className="mission-actions">
                                    <form method="POST" action="/missions/accept">
                                        <input type="hidden" name="mission_id" value={mission.id} />
                                        <button type="submit" className="btn btn-primary">РџСЂРёРЅСЏС‚СЊ Р·Р°РґР°РЅРёРµ</button>
                    </form>
                                </div>
                            )
                        ) : (
                            <button type="button" className="btn btn-secondary" disabled>Р–СѓСЂРЅР°Р»РёСЃС‚ РЅРµ РјРѕР¶РµС‚ РїСЂРёРЅРёРјР°С‚СЊ Р·Р°РґР°РЅРёСЏ</button>
                        )}
                    </article>
                ))}

                {!missions.length ? (
                    <section className="placeholder-card">
                        <h3>Р—Р°РґР°РЅРёР№ РїРѕРєР° РЅРµС‚</h3>
                        <p>Р”РѕР±Р°РІР»РµРЅРЅС‹Рµ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂРѕРј Р·Р°РґР°РЅРёСЏ РѕС‚РѕР±СЂР°Р¶Р°СЋС‚СЃСЏ Р·РґРµСЃСЊ.</p>
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
                    <h1>Р“Р•Р Р¦Р« Р›Р•Р“РРћРќРћР’</h1>
                </div>

                <section className="placeholder-card table-card bank-table-card">
                    <div className="table-responsive bank-table-responsive">
                        <table className="table elegant-table bank-table bank-scoreboard-table">
                            <thead>
                                <tr>
                                    <th>Р›Р•Р“РРћРќ</th>
                                    <th>РС‚РѕРіРѕ:</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scoreboard.map((row, index) => (
                                    <tr key={`${row.Name}-${index}`}>
                                        <td data-label="Р›РµРіРёРѕРЅ">{row.Name}</td>
                                        <td data-label="РС‚РѕРіРѕ">{row.Scores}</td>
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
        <section className="bank-balance-strip">
            <h3>
                <span className="bank-balance-label">Р“РµСЂС†С‹ С‚РІРѕРµРіРѕ Р›РµРіРёРѕРЅР°:</span>
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
            <div className="bank-action-bar">
                <button
                    type="button"
                    className="btn btn-primary bank-action-button"
                    data-bs-toggle="modal"
                    data-bs-target="#exampleModal"
                >
                    РћС‚РїСЂР°РІРёС‚СЊ РіРµСЂС†С‹ Р»РµРіРёРѕРЅСѓ
                </button>
            </div>

            <div className="modal fade" id="exampleModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <form method="POST" action="/api/add_operation">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5" id="exampleModalLabel">Р¤РѕСЂРјР° РѕС‚РїСЂР°РІРєРё РіРµСЂС†РµРІ</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Р—Р°РєСЂС‹С‚СЊ"></button>
                            </div>

                            <div className="modal-body">
                                {!is_admin ? (
                                    <input name="parent" type="hidden" id="parent" value={current_team_id || ""} />
                                ) : (
                                    <>
                                        <label htmlFor="userSRC">Р’С‹Р±РµСЂРёС‚Рµ С„СЂР°РєС†РёСЋ РѕС‚РїСЂР°РІРёС‚РµР»СЏ:</label>
                                        <select className="form-control" id="userSRC" name="parent" defaultValue={defaultSourceId}>
                                            {teams_for_select.map((team) => (
                                                <option key={`src-${team.id}`} value={team.id} data-balance={team.balance}>
                                                    {team.name}
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                )}

                                <label htmlFor="usersDST">Р’С‹Р±РµСЂРёС‚Рµ Р»РµРіРёРѕРЅ РїРѕР»СѓС‡Р°С‚РµР»СЏ:</label>
                                <select className="form-control" id="usersDST" name="user" defaultValue={defaultTargetId}>
                                    {teams_for_select.map((team) => (
                                        <option key={`dst-${team.id}`} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>

                                <label htmlFor="PLT">РљРѕР»РёС‡РµСЃС‚РІРѕ GRZ:</label>
                                <input
                                    name="score"
                                    type="number"
                                    min="0"
                                    max={defaultMax}
                                    step="1"
                                    defaultValue={defaultScore}
                                    id="PLT"
                                    className="form-control"
                                    placeholder="С†РµРЅР°"
                                    disabled={!transferPossible && !is_admin}
                                />

                                <label htmlFor="comment">РљРѕРјРјРµРЅС‚Р°СЂРёР№ Р»РµРіРёРѕРЅСѓ:</label>
                                <input
                                    name="comment"
                                    type="text"
                                    className="form-control"
                                    id="comment"
                                    placeholder="Р’РІРµРґРёС‚Рµ СЃРѕРѕР±С‰РµРЅРёРµ Р»РµРіРёРѕРЅСѓ"
                                />

                                <div className="form-text" id="transferState">
                                    {!is_admin && current_plt <= 0 ? "РџРµСЂРµРІРѕРґ РЅРµРґРѕСЃС‚СѓРїРµРЅ: Сѓ С‚РµРєСѓС‰РµРіРѕ Р»РµРіРёРѕРЅР° РЅСѓР»РµРІРѕР№ Р±Р°Р»Р°РЅСЃ." : ""}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Р—Р°РєСЂС‹С‚СЊ</button>
                                <button type="submit" className="btn btn-primary" id="transferSubmit" disabled={!transferPossible && !is_admin}>
                                    РћС‚РїСЂР°РІРёС‚СЊ
                                </button>
                            </div>
                        </div>
                    </div>
                    </form>
            </div>

            <div className="events-panel bank-operations-panel">
                <h3 className="events-title">Р’СЃРµ СЃРѕР±С‹С‚РёСЏ:</h3>
                <section className="placeholder-card table-card bank-table-card">
                    <div className="table-responsive bank-table-responsive">
                        <table className="table elegant-table bank-table bank-operations-table">
                            <thead>
                                <tr>
                                    <th>РџРµСЂРёРѕРґ:</th>
                                    <th>РќР°Р·РІР°РЅРёРµ Р»РµРіРёРѕРЅР°:</th>
                                    <th>Р“РµСЂС†С‹:</th>
                                    <th>РљРѕРјРјРµРЅС‚:</th>
                                </tr>
                            </thead>
                            <tbody>
                                {operations.map((row, index) => (
                                    <tr key={`${row.Name}-${row.Period}-${index}`}>
                                        <td data-label="РџРµСЂРёРѕРґ">{formatDate(row.Period)}</td>
                                        <td data-label="Р›РµРіРёРѕРЅ">{row.Name}</td>
                                        <td data-label="Р“РµСЂС†С‹">{row.Score}</td>
                                        <td data-label="РљРѕРјРјРµРЅС‚">{row.Comment}</td>
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
        <div className="section-page approve-page ceremonial-page">
            <Hero
                title="РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ"
                description="Р—РґРµСЃСЊ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ РїРѕРґС‚РІРµСЂР¶РґР°РµС‚ РёР»Рё РѕС‚РєР»РѕРЅСЏРµС‚ РІС‹РїРѕР»РЅРµРЅРёРµ РїСЂРёРЅСЏС‚С‹С… Р·Р°РґР°РЅРёР№. РџРѕСЃР»Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РЅР°РіСЂР°РґР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РЅР°С‡РёСЃР»СЏРµС‚СЃСЏ РѕС‚СЂСЏРґСѓ."
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
                            <span>РћС‚СЂСЏРґ: {item.team_name}</span>
                            <span>РќР°РіСЂР°РґР°: {item.reward} GRZ</span>
                        </div>
                        <div className="approve-actions">
                            <form method="POST" action="/approve/confirm">
                                <input type="hidden" name="assignment_id" value={item.id} />
                                <button type="submit" className="btn btn-primary">РџРѕРґС‚РІРµСЂРґРёС‚СЊ РІС‹РїРѕР»РЅРµРЅРёРµ</button>
                    </form>
                            <form method="POST" action="/approve/reject">
                                <input type="hidden" name="assignment_id" value={item.id} />
                                <button type="submit" className="btn btn-outline-light">РћС‚РєР»РѕРЅРёС‚СЊ РІС‹РїРѕР»РЅРµРЅРёРµ</button>
                    </form>
                        </div>
                    </article>
                ))}

                {!approve_items.length ? (
                    <section className="placeholder-card">
                        <h3>РќРµС‚ Р·Р°РґР°РЅРёР№ РЅР° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ</h3>
                        <p>РџСЂРёРЅСЏС‚С‹Рµ Р·Р°РґР°РЅРёСЏ РѕС‚РѕР±СЂР°Р¶Р°СЋС‚СЃСЏ РІ СЌС‚РѕРј СЃРїРёСЃРєРµ.</p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function StudiosPage({ studios_items = [], can_manage_studios = false }) {
    const audienceOptions = [
        { value: "middle", label: "РЎСЂРµРґРЅРёРµ (ID 6-9)" },
        { value: "senior", label: "РЎС‚Р°СЂС€РёРµ (ID 10-13)" },
        { value: "all", label: "Р”Р»СЏ РІСЃРµС…" },
    ];
    const audienceLabels = {
        middle: "Р”Р»СЏ СЃСЂРµРґРЅРёС…",
        senior: "Р”Р»СЏ СЃС‚Р°СЂС€РёС…",
        all: "Р”Р»СЏ РІСЃРµС…",
    };

    return (
        <div className="section-page studios-page ceremonial-page">
            <Hero
                title="РљР°С„РµРґСЂС‹"
                description="Р—РґРµСЃСЊ СЃРѕР±СЂР°РЅС‹ РєР°С„РµРґСЂС‹ РРјРїРµСЂРёРё."
            />
            {can_manage_studios ? (
                <section className="placeholder-card news-form-card news-suggest-card studios-form-card">
                    <details className="news-edit-block news-suggest-block is-collapsed studios-create-block">
                        <summary className="news-edit-summary">Р”РѕР±Р°РІРёС‚СЊ РєР°С„РµРґСЂСѓ</summary>
                        <div className="news-edit-body">
                            <form method="POST" action="/studios/add" encType="multipart/form-data" className="news-edit-form">
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="studio-title">РќР°Р·РІР°РЅРёРµ РєР°С„РµРґСЂС‹</label>
                                    <input className="form-control" id="studio-title" name="title" type="text" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="studio-description">РћРїРёСЃР°РЅРёРµ РєР°С„РµРґСЂС‹</label>
                                    <textarea className="form-control" id="studio-description" name="description" rows="5" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="studio-image">РР·РѕР±СЂР°Р¶РµРЅРёРµ</label>
                                    <input className="form-control" id="studio-image" name="image" type="file" accept=".png,.jpg,.jpeg,.gif,.webp" />
                                    <div className="form-text text-light">РљР°СЂС‚РёРЅРєР° РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅР°. Р•СЃР»Рё РЅСѓР¶РЅР°, Р»СѓС‡С€Рµ РѕРґРЅРѕ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РЅР° РєР°С„РµРґСЂСѓ.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="studio-audience">РџРѕРєР°Р·С‹РІР°С‚СЊ РіСЂСѓРїРїРµ</label>
                                    <select className="form-control" id="studio-audience" name="audience" defaultValue="all">
                                        {audienceOptions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary">Р”РѕР±Р°РІРёС‚СЊ РєР°С„РµРґСЂСѓ</button>
                    </form>
                        </div>
                    </details>
                </section>
            ) : null}
            <div className="news-list">
                {studios_items.map((item) => (
                    <article className="placeholder-card news-card studio-card" key={item.id}>
                        <div className="news-meta">
                            <span>{item.author_name}</span>
                            <span>{formatDateTime(item.created_at)}</span>
                        </div>
                        {can_manage_studios ? (
                            <div className="news-suggestion-status">{audienceLabels[item.audience] || audienceLabels.all}</div>
                        ) : null}
                        <h3>{item.title}</h3>
                        {item.image_path ? <img className="news-image studio-image" src={uploadedPath(item.image_path)} alt={item.title} loading="lazy" decoding="async" /> : null}
                        <p className="news-content">{item.description}</p>
                        {can_manage_studios ? (
                            <div className="news-card-actions studio-card-actions">
                                <details className="news-edit-block news-edit-action is-collapsed">
                                    <summary className="news-edit-summary">Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РєР°С„РµРґСЂСѓ</summary>
                                    <div className="news-edit-body">
                                        <form method="POST" action="/studios/update" encType="multipart/form-data" className="news-edit-form">
                                            <input type="hidden" name="studio_id" value={item.id} />
                                            <div className="mb-3">
                                                <label className="form-label" htmlFor={`studio-edit-title-${item.id}`}>РќР°Р·РІР°РЅРёРµ РєР°С„РµРґСЂС‹</label>
                                                <input className="form-control" id={`studio-edit-title-${item.id}`} name="title" type="text" defaultValue={item.title} required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label" htmlFor={`studio-edit-description-${item.id}`}>РћРїРёСЃР°РЅРёРµ РєР°С„РµРґСЂС‹</label>
                                                <textarea className="form-control" id={`studio-edit-description-${item.id}`} name="description" rows="5" defaultValue={item.description} required />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label" htmlFor={`studio-edit-audience-${item.id}`}>РџРѕРєР°Р·С‹РІР°С‚СЊ РіСЂСѓРїРїРµ</label>
                                                <select className="form-control" id={`studio-edit-audience-${item.id}`} name="audience" defaultValue={item.audience || "all"}>
                                                    {audienceOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {item.image_path ? (
                                                <div className="mb-3">
                                                    <div className="form-label">РўРµРєСѓС‰РµРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ</div>
                                                    <img className="news-edit-media-preview" src={uploadedPath(item.image_path)} alt={item.title} loading="lazy" decoding="async" />
                                                    <label className="news-edit-remove">
                                                        <input type="checkbox" name="remove_image" value="1" />
                                                        <span>РЈР±СЂР°С‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ</span>
                                                    </label>
                                                </div>
                                            ) : null}
                                            <div className="mb-3">
                                                <label className="form-label" htmlFor={`studio-edit-image-${item.id}`}>РќРѕРІРѕРµ РёР·РѕР±СЂР°Р¶РµРЅРёРµ</label>
                                                <input className="form-control" id={`studio-edit-image-${item.id}`} name="image" type="file" accept=".png,.jpg,.jpeg,.gif,.webp" />
                                            </div>
                                            <button type="submit" className="btn btn-primary">РЎРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ</button>
                                        </form>
                                    </div>
                                </details>
                                <form method="POST" action="/studios/delete" onSubmit={(event) => { if (!window.confirm("Р’С‹ СѓРІРµСЂРµРЅС‹, С‡С‚Рѕ С…РѕС‚РёС‚Рµ СѓРґР°Р»РёС‚СЊ СЌС‚Сѓ РєР°С„РµРґСЂСѓ?")) { event.preventDefault(); } }}>
                                    <input type="hidden" name="studio_id" value={item.id} />
                                    <button type="submit" className="btn btn-outline-light">РЈРґР°Р»РёС‚СЊ РєР°С„РµРґСЂСѓ</button>
                    </form>
                            </div>
                        ) : null}
                    </article>
                ))}
                {!studios_items.length ? (
                    <section className="placeholder-card">
                        <h3>РљР°С„РµРґСЂ РїРѕРєР° РЅРµС‚</h3>
                        <p>Р”РѕР±Р°РІР»РµРЅРЅС‹Рµ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂРѕРј РєР°С„РµРґСЂС‹ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ.</p>
                    </section>
                ) : null}
            </div>
        </div>
    );
}
function PlaceholderPage({ section_title, section_description }) {
    return (
        <div className="section-page placeholder-page ceremonial-page">
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
            case "studios":
                return <StudiosPage {...bootstrapData} />;
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
                            <h3>РЎС‚СЂР°РЅРёС†Р° РЅРµ РЅР°Р№РґРµРЅР°</h3>
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


