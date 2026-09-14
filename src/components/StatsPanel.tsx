// StatsPanel — Monthly statistics and streak display

import { useMemo } from "react";
import { motion } from "framer-motion";
import { type DayTrackData, getMonthStats, getStreaks } from "@/lib/daytrack";

interface StatsPanelProps {
  data: DayTrackData;
}

export function StatsPanel({ data }: StatsPanelProps) {
  const today = new Date();
  const stats = useMemo(
    () => getMonthStats(data, today.getFullYear(), today.getMonth()),
    [data, today.getFullYear(), today.getMonth()],
  );

  const streaks = useMemo(() => getStreaks(data), [data]);

  return (
    <div className="notebook-stats-panel">
      {/* Monthly stats */}
      <div className="notebook-stats-grid">
        <motion.div
          className="notebook-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="stat-number good">{stats.goodDays}</span>
          <span className="stat-label">Good Days</span>
        </motion.div>

        <motion.div
          className="notebook-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="stat-number wasted">{stats.wastedDays}</span>
          <span className="stat-label">Wasted Days</span>
        </motion.div>

        <motion.div
          className="notebook-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="stat-number neutral">{stats.unmarkedDays}</span>
          <span className="stat-label">Unmarked</span>
        </motion.div>

        <motion.div
          className="notebook-stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <span className="stat-number percent">{stats.goodPercentage}%</span>
          <span className="stat-label">Good Day Rate</span>
        </motion.div>
      </div>

      {/* Streaks */}
      <div className="notebook-streaks">
        <div className="notebook-streak-card">
          <div className="streak-fire">🔥</div>
          <div className="streak-info">
            <span className="streak-number">{streaks.current}</span>
            <span className="streak-label">Current Streak</span>
            <span className="streak-unit">days</span>
          </div>
        </div>

        <div className="notebook-streak-card">
          <div className="streak-trophy">🏆</div>
          <div className="streak-info">
            <span className="streak-number">{streaks.best}</span>
            <span className="streak-label">Best Streak</span>
            <span className="streak-unit">days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
