import { useState } from "react";
import { Header } from "./components/Header";
import { DashboardView } from "./views/DashboardView";
import { EventsView } from "./views/EventsView";
import { AthletesView } from "./views/AthletesView";
import { TeamsView } from "./views/TeamsView";
import { EntriesView } from "./views/EntriesView";
import { HeatsView } from "./views/HeatsView";
import { FinalsView } from "./views/FinalsView";
import { ScheduleView } from "./views/ScheduleView";
import { ReportsView } from "./views/ReportsView";
import { SettingsView } from "./views/SettingsView";
import { DataProvider } from "./context/DataContext";
import { ThemeProvider } from "./context/ThemeContext";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "events":
        return <EventsView />;
      case "athletes":
        return <AthletesView />;
      case "teams":
        return <TeamsView />;
      case "entries":
        return <EntriesView />;
      case "heats":
        return <HeatsView />;
      case "finals":
        return <FinalsView />;
      case "schedule":
        return <ScheduleView />;
      case "reports":
        return <ReportsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-4 py-8">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}