// React hook for DayTrack localStorage data store

import { useState, useCallback, useEffect } from "react";
import {
  type DayTrackData,
  type DayStatus,
  loadData,
  saveData,
  setDayStatus as _setDayStatus,
  setDayNote as _setDayNote,
  clearDayStatus as _clearDayStatus,
  exportData as _exportData,
  importData as _importData,
  dateKeyFromDate,
} from "@/lib/daytrack";

export function useDayTrack() {
  const [data, setData] = useState<DayTrackData>(() => loadData());

  // Persist on every change
  useEffect(() => {
    saveData(data);
  }, [data]);

  const markDay = useCallback(
    (dateKey: string, status: DayStatus) => {
      setData((prev) => _setDayStatus(prev, dateKey, status));
    },
    [],
  );

  const updateNote = useCallback(
    (dateKey: string, note: string) => {
      setData((prev) => _setDayNote(prev, dateKey, note));
    },
    [],
  );

  const clearDay = useCallback(
    (dateKey: string) => {
      setData((prev) => _clearDayStatus(prev, dateKey));
    },
    [],
  );

  const markToday = useCallback(
    (status: DayStatus) => {
      const key = dateKeyFromDate(new Date());
      setData((prev) => _setDayStatus(prev, key, status));
    },
    [],
  );

  const exportAll = useCallback(() => {
    return _exportData(data);
  }, [data]);

  const importAll = useCallback((jsonStr: string) => {
    const parsed = _importData(jsonStr);
    setData(parsed);
  }, []);

  const clearAll = useCallback(() => {
    setData({});
  }, []);

  return {
    data,
    markDay,
    updateNote,
    clearDay,
    markToday,
    exportAll,
    importAll,
    clearAll,
  };
}
