import { useEffect, useState } from "react";

const DISPLAY_TIME_ZONE = "Etc/GMT-5";

export function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE
  }).format(date);
}

export function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE
  }).format(date);
}

export function uploadedPath(path) {
  if (!path) return "";
  return `/uploads/${String(path).replace(/^uploads\//, "")}`;
}

export function FlashMessages({ messages }) {
  if (!messages || !messages.length) return null;

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

export function SiteNotification({ notice }) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = notice?.kind ? `site-notice:${notice.kind}` : "";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const clearDismissedNotices = () => {
      try {
        window.localStorage.removeItem("site-notice:pending_news");
        window.localStorage.removeItem("site-notice:rejected_news");
      } catch (_error) {
        return;
      }
    };

    if (!notice?.signature || !storageKey) {
      clearDismissedNotices();
      setIsVisible(false);
      return undefined;
    }

    try {
      setIsVisible(window.localStorage.getItem(storageKey) !== notice.signature);
    } catch (_error) {
      setIsVisible(true);
    }
    return undefined;
  }, [notice?.signature, storageKey]);

  if (!notice?.signature || !isVisible) return null;

  const dismiss = () => {
    if (typeof window !== "undefined" && storageKey) {
      try {
        window.localStorage.setItem(storageKey, notice.signature);
      } catch (_error) {
        // ponytail: best-effort persistence, in-memory dismissal is enough if storage is blocked.
      }
    }
    setIsVisible(false);
  };

  return (
    <aside className="site-notice" role="dialog" aria-live="polite" aria-label={notice.title || "Уведомление"}>
      <div className="site-notice-title">{notice.title}</div>
      <div className="site-notice-text">{notice.message}</div>
      <div className="site-notice-actions">
        <button type="button" className="btn btn-outline-light" onClick={dismiss}>{notice.dismiss_label || "Окей"}</button>
        {notice.action_href ? <a className="btn btn-primary" href={notice.action_href} onClick={dismiss}>{notice.action_label || "Перейти"}</a> : null}
      </div>
    </aside>
  );
}

export function LoginMessages({ messages }) {
  if (!messages || !messages.length) return null;

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

export function Hero({ title, description, extraClass = "" }) {
  return (
    <div className={`placeholder-hero ${extraClass}`.trim()}>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function Header({ user, activeSection, pendingNewsCount = 0 }) {
  if (!user) return null;

  const isAdmin = Boolean(user.isadmin);
  const menuItems = [
    { key: "home", href: "/home", label: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f" },
    { key: "studios", href: "/studios", label: "Гильдии" },
    { key: "history", href: "/history", label: "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0438 \u043a\u043e\u0434\u0435\u043a\u0441" },
    { key: "bonus", href: "/bonus", label: "\u0411\u043e\u043d\u0443\u0441\u043d\u0430\u044f \u0441\u0438\u0441\u0442\u0435\u043c\u0430" },
    { key: "bank", href: "/teams", label: "\u0411\u0430\u043d\u043a" }
  ];

  if (isAdmin) {
    menuItems.push({ key: "approve", href: "/approve", label: "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435" });
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
              {"\u041c\u0435\u043d\u044e"}
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
                  <button type="submit" className="nav-link nav-link-button">{"\u0412\u044b\u0445\u043e\u0434"}</button>
                </form>
              </li>
            </ul>
            <ul className="nav menu-account-controls" id="user-controls">
              <li className="nav-item user-status-item">
                <div className="user-status-panel">{user.view}</div>
              </li>
              <li className="nav-item">
                <form method="POST" action="/logout" className="nav-link-form">
                  <button type="submit" className="nav-link nav-link-button">{"\u0412\u044b\u0445\u043e\u0434"}</button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
