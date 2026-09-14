// DateDetail — Panel shown when a date is clicked on the calendar

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  dateKeyFromDate,
  getDayStatus,
  type DayTrackData,
  type DayStatus,
  DAY_NAMES_FULL,
  MONTH_NAMES,
} from "@/lib/daytrack";

interface DateDetailProps {
  data: DayTrackData;
  date: Date;
  onMark: (dateKey: string, status: DayStatus) => void;
  onUpdateNote: (dateKey: string, note: string) => void;
  onClear: (dateKey: string) => void;
}

export function DateDetail({
  data,
  date,
  onMark,
  onUpdateNote,
  onClear,
}: DateDetailProps) {
  const key = dateKeyFromDate(date);
  const entry = data[key];
  const status = entry?.status ?? null;
  const note = entry?.note ?? "";

  const [localNote, setLocalNote] = useState(note);

  // Sync local note when data changes
  useEffect(() => {
    setLocalNote(entry?.note ?? "");
  }, [entry?.note]);

  const dayName = DAY_NAMES_FULL[(date.getDay() + 6) % 7];
  const monthName = MONTH_NAMES[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();

  const isToday =
    dateKeyFromDate(new Date()) === key;

  const isFuture = date > new Date(new Date().setHours(0, 0, 0, 0));

  if (isFuture) {
    return (
      <div className="notebook-date-detail">
        <p className="notebook-date-detail-title">
          {monthName} {dayNum}, {year}
        </p>
        <p className="notebook-future-note">
          This date is in the future — you can evaluate it when it arrives.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="notebook-date-detail"
    >
      <div className="flex items-baseline gap-2 mb-4">
        <span className="notebook-date-detail-title">
          {monthName} {dayNum}, {year}
        </span>
        {isToday && <span className="notebook-today-tag">today</span>}
      </div>

      <p className="notebook-question mb-3">How was this day?</p>

      <div className="notebook-detail-actions">
        <button
          onClick={() => onMark(key, "good")}
          className={`notebook-detail-btn good ${status === "good" ? "active" : ""}`}
        >
          <span>✓</span> Good Day
        </button>
        <button
          onClick={() => onMark(key, "wasted")}
          className={`notebook-detail-btn wasted ${status === "wasted" ? "active" : ""}`}
        >
          <span>○</span> Wasted Day
        </button>
        {status && (
          <button
            onClick={() => onClear(key)}
            className="notebook-detail-btn clear"
          >
            Clear Status
          </button>
        )}
      </div>

      <div className="notebook-note-section">
        <label className="notebook-note-label">
          Notes <span className="notebook-note-optional">(optional)</span>
        </label>
        <textarea
          value={localNote}
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={() => {
            if (localNote !== note) {
              onUpdateNote(key, localNote);
            }
          }}
          placeholder="What happened today?"
          className="notebook-textarea"
          rows={3}
        />
        <button
          onClick={() => {
            if (localNote !== note) {
              onUpdateNote(key, localNote);
            }
          }}
          className="notebook-save-btn"
        >
          Save
        </button>
      </div>
    </motion.div>
  );
}
