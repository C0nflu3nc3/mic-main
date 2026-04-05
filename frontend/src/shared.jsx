export function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
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

export function Header({ user, activeSection }) {
  if (!user) return null;

  const isAdmin = Boolean(user.isadmin);
  const menuItems = [
    { key: "home", href: "/home", label: "Главная" },
    { key: "studios", href: "/studios", label: "Студии" },
    { key: "history", href: "/history", label: "История и кодекс" },
    { key: "bonus", href: "/bonus", label: "Бонусная система" },
    { key: "bank", href: "/teams", label: "Банк" }
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

          <ul className="nav justify-content-end" id="user-controls">
            <li className="nav-item user-status-item">
              <div className="user-status-panel">{user.view}</div>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/logout">Выход</a>
            </li>
          </ul>
        </div>

        <div className="menu-collapse" id="mainMenuCollapse">
          <ul className="nav section-nav" id="main-sections">
            {menuItems.map((item) => (
              <li className="nav-item main-nav-item" key={item.key}>
                <a
                  className={`nav-link ${activeSection === item.key ? "active" : ""}`.trim()}
                  href={item.href}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="nav-item menu-extra-item">
              <a className="nav-link" href="/logout">Выход</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
