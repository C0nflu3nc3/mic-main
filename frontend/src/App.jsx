import { FlashMessages, Header } from "./shared";
import { HomePage, LeaderboardPage, LoginPage, NewsPage } from "./pages-main";
import { ApprovePage, MissionsPage, PlaceholderPage, TeamsPage } from "./pages-secondary";

export default function App({ bootstrapData }) {
  const page = bootstrapData.page;

  const renderPage = () => {
    switch (page) {
      case "login":
        return <LoginPage messages={bootstrapData.messages} />;
      case "home":
        return <HomePage />;
      case "leaderboard":
        return <LeaderboardPage {...bootstrapData} />;
      case "news":
        return <NewsPage {...bootstrapData} />;
      case "missions":
        return <MissionsPage {...bootstrapData} />;
      case "teams":
        return <TeamsPage {...bootstrapData} />;
      case "approve":
        return <ApprovePage {...bootstrapData} />;
      case "placeholder":
        return <PlaceholderPage {...bootstrapData} />;
      default:
        return <div className="section-page"><section className="placeholder-card"><h3>Страница не найдена</h3></section></div>;
    }
  };

  if (page === "login") {
    return renderPage();
  }

  return (
    <>
      <Header user={bootstrapData.user} activeSection={bootstrapData.activeSection} />
      <div className="container">
        <FlashMessages messages={bootstrapData.messages} />
        {renderPage()}
      </div>
    </>
  );
}
