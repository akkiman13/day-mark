// TodayPanel — Prominent "today" section with evaluation buttons

import { motion, AnimatePresence } from "framer-motion";
import {
  dateKeyFromDate,
  getDayStatus,
  type DayTrackData,
  type DayStatus,
  DAY_NAMES_FULL,
  MONTH_NAMES,
} from "@/lib/daytrack";

interface TodayPanelProps {
  data: DayTrackData;
  onMark: (status: DayStatus) => void;
}

export function TodayPanel({ data, onMark }: TodayPanelProps) {
  const today = new Date();
  const key = dateKeyFromDate(today);
  const status = getDayStatus(data, key);

  const dayName = DAY_NAMES_FULL[(today.getDay() + 6) % 7]; // Mon=0
  const monthName = MONTH_NAMES[today.getMonth()];
  const dayNum = today.getDate();
  const year = today.getFullYear();

  return (
    <div className="notebook-today">
      <div className="notebook-today-header">
        <span className="notebook-label">TODAY</span>
        <span className="notebook-date-display">
          {dayName}, {monthName} {dayNum}, {year}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!status ? (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="notebook-today-prompt"
          >
            <p className="notebook-question">Have you used today well?</p>
            <div className="notebook-today-actions">
              <button
                onClick={() => onMark("good")}
                className="notebook-btn-good"
              >
                <span className="check-icon">✓</span> Yes, Good Day
              </button>
              <button
                onClick={() => onMark("wasted")}
                className="notebook-btn-wasted"
              >
                <span className="cross-icon">✕</span> I wasted it
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="notebook-today-status"
          >
            <div className={`notebook-status-badge ${status}`}>
              {status === "good" ? (
                <>
                  <span className="badge-icon">✓</span> GOOD DAY
                </>
              ) : (
                <>
                  <span className="badge-icon">○</span> WASTED DAY
                </>
              )}
            </div>
            <p className="notebook-status-note">
              You can change this later.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
