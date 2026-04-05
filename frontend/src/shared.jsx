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
    { key: "home", href: "/home", label: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f" },
    { key: "studios", href: "/studios", label: "\u0421\u0442\u0443\u0434\u0438\u0438" },
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

          <ul className="nav justify-content-end" id="user-controls">
            <li className="nav-item user-status-item">
              <div className="user-status-panel">{user.view}</div>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/logout">{"\u0412\u044b\u0445\u043e\u0434"}</a>
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
              <a className="nav-link" href="/logout">{"\u0412\u044b\u0445\u043e\u0434"}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
