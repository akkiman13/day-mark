// DayTrack — Main page composing all components

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { useDayTrack } from "@/hooks/use-daytrack";
import { Calendar } from "@/components/Calendar";
import { TodayPanel } from "@/components/TodayPanel";
import { DateDetail } from "@/components/DateDetail";
import { StatsPanel } from "@/components/StatsPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function DayTrack() {
  const {
    data,
    markDay,
    updateNote,
    clearDay,
    markToday,
    exportAll,
    importAll,
    clearAll,
  } = useDayTrack();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="notebook-app">
      {/* Header */}
      <header className="notebook-header">
        <div className="notebook-header-inner">
          <div className="notebook-brand">
            <span className="notebook-logo">📓</span>
            <h1 className="notebook-title">DayTrack</h1>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="notebook-settings-toggle"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="notebook-main">
        {/* Settings panel (toggle) */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <SettingsPanel
              onExport={exportAll}
              onImport={importAll}
              onClear={clearAll}
            />
          </motion.div>
        )}

        {/* Today Panel */}
        <section className="notebook-section">
          <TodayPanel data={data} onMark={markToday} />
        </section>

        {/* Calendar */}
        <section className="notebook-section">
          <Calendar
            data={data}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </section>

        {/* Date Detail (shown when a date is selected) */}
        {selectedDate && (
          <section className="notebook-section">
            <DateDetail
              data={data}
              date={selectedDate}
              onMark={markDay}
              onUpdateNote={updateNote}
              onClear={clearDay}
            />
          </section>
        )}

        {/* Stats */}
        <section className="notebook-section">
          <StatsPanel data={data} />
        </section>

        {/* History */}
        <section className="notebook-section">
          <HistoryPanel data={data} onSelectDate={setSelectedDate} />
        </section>
      </main>

      {/* Footer */}
      <footer className="notebook-footer">
        <p>DayTrack — Your honest daily record</p>
      </footer>
    </div>
  );
}
