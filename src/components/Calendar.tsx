// Calendar component — the visual centerpiece of DayTrack

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type DayTrackData,
  type DayStatus,
  getCalendarDays,
  getMonthStats,
  dateKeyFromParts,
  dateKeyFromDate,
  MONTH_NAMES,
  DAY_NAMES,
} from "@/lib/daytrack";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  data: DayTrackData;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function Calendar({ data, selectedDate, onSelectDate }: CalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [direction, setDirection] = useState(0);

  const days = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const stats = useMemo(
    () => getMonthStats(data, currentYear, currentMonth),
    [data, currentYear, currentMonth],
  );

  const goToPrevMonth = () => {
    setDirection(-1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    setDirection(1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setDirection(0);
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const getStatus = (year: number, month: number, day: number): DayStatus | null => {
    const key = dateKeyFromParts(year, month, day);
    const entry = data[key];
    return entry?.status ?? null;
  };

  const selectedKey = selectedDate ? dateKeyFromDate(selectedDate) : null;

  return (
    <div className="notebook-page">
      {/* Month header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevMonth}
          className="notebook-nav-btn"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1">
          <h2 className="notebook-heading text-2xl tracking-wide">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <div className="notebook-stats-row mt-2 text-xs">
            <span className="stat-good">{stats.goodDays} good</span>
            <span className="stat-divider">·</span>
            <span className="stat-wasted">{stats.wastedDays} wasted</span>
            <span className="stat-divider">·</span>
            <span className="stat-neutral">{stats.unmarkedDays} unmarked</span>
          </div>
        </div>
        <button
          onClick={goToNextMonth}
          className="notebook-nav-btn"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Today button */}
      {!(
        currentYear === today.getFullYear() && currentMonth === today.getMonth()
      ) && (
        <div className="text-center mb-4">
          <button
            onClick={goToToday}
            className="notebook-today-btn"
          >
            ← Back to today
          </button>
        </div>
      )}

      {/* Day names row */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="notebook-day-header text-center text-xs font-semibold tracking-widest uppercase"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`${currentYear}-${currentMonth}`}
          custom={direction}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-7"
        >
          {days.map((day, i) => {
            const key = dateKeyFromParts(
              day.date.getFullYear(),
              day.date.getMonth(),
              day.dayOfMonth,
            );
            const status = getStatus(
              day.date.getFullYear(),
              day.date.getMonth(),
              day.dayOfMonth,
            );
            const isSelected = key === selectedKey;
            const isFuture = day.isFuture;

            return (
              <motion.button
                key={key}
                onClick={() => !isFuture && onSelectDate(day.date)}
                disabled={isFuture}
                className={`
                  notebook-day-cell
                  ${day.isCurrentMonth ? "" : "opacity-25"}
                  ${day.isToday ? "is-today" : ""}
                  ${status === "good" ? "is-good" : ""}
                  ${status === "wasted" ? "is-wasted" : ""}
                  ${isSelected ? "is-selected" : ""}
                  ${isFuture ? "cursor-not-allowed" : ""}
                `}
                whileHover={!isFuture ? { scale: 1.05 } : undefined}
                whileTap={!isFuture ? { scale: 0.95 } : undefined}
              >
                {status === "wasted" && (
                  <span className="wasted-circle" />
                )}
                <span className="relative z-10">{day.dayOfMonth}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
