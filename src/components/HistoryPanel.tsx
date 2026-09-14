// HistoryPanel — Recent days list view

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  type DayTrackData,
  type DayStatus,
  getRecentHistory,
  MONTH_NAMES,
} from "@/lib/daytrack";

interface HistoryPanelProps {
  data: DayTrackData;
  onSelectDate: (date: Date) => void;
}

export function HistoryPanel({ data, onSelectDate }: HistoryPanelProps) {
  const history = useMemo(() => getRecentHistory(data, 10), [data]);

  const formatStatus = (status: DayStatus | null): string => {
    if (status === "good") return "✓ Good";
    if (status === "wasted") return "○ Wasted";
    return "—";
  };

  const getStatusClass = (status: DayStatus | null): string => {
    if (status === "good") return "history-good";
    if (status === "wasted") return "history-wasted";
    return "history-unmarked";
  };

  return (
    <div className="notebook-history">
      <h3 className="notebook-section-title">Recent Days</h3>
      <div className="notebook-history-list">
        {history.map((entry, i) => (
          <motion.button
            key={entry.dateKey}
            onClick={() => onSelectDate(entry.date)}
            className="notebook-history-item"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <span className="history-date">
              {MONTH_NAMES[entry.date.getMonth()]} {entry.date.getDate()}
            </span>
            <span className={`history-status ${getStatusClass(entry.status)}`}>
              {formatStatus(entry.status)}
            </span>
            {entry.note && (
              <span className="history-note">
                {entry.note.length > 30
                  ? entry.note.slice(0, 30) + "…"
                  : entry.note}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
