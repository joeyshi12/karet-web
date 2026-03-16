'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

type PresetOption = {
  label: string;
  getValue: () => { start: Date; end: Date };
};

const inputBase = "h-[34px] px-2 text-[0.8125rem] border-2 border-carrot-orange rounded-md bg-soft-cream text-gray-800 cursor-pointer transition-all duration-200 hover:border-leafy-green focus:outline-none focus:border-leafy-green focus:ring-3 focus:ring-leafy-green/20 max-sm:w-full max-sm:h-9";

/**
 * DateRangeFilter component displays date picker controls for start and end dates
 * with preset options for common date ranges.
 */
export function DateRangeFilter({
  startDate,
  endDate,
  onDateRangeChange,
}: DateRangeFilterProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const presetOptions: PresetOption[] = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return [
      {
        label: 'Last 30 days',
        getValue: () => {
          const start = new Date(today);
          start.setDate(start.getDate() - 30);
          start.setHours(0, 0, 0, 0);
          return { start, end: today };
        },
      },
      {
        label: 'Last 3 months',
        getValue: () => {
          const start = new Date(today);
          start.setMonth(start.getMonth() - 3);
          start.setHours(0, 0, 0, 0);
          return { start, end: today };
        },
      },
      {
        label: 'Last 6 months',
        getValue: () => {
          const start = new Date(today);
          start.setMonth(start.getMonth() - 6);
          start.setHours(0, 0, 0, 0);
          return { start, end: today };
        },
      },
      {
        label: 'Last year',
        getValue: () => {
          const start = new Date(today);
          start.setFullYear(start.getFullYear() - 1);
          start.setHours(0, 0, 0, 0);
          return { start, end: today };
        },
      },
    ];
  }, []);

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateFromInput = (value: string): Date | null => {
    if (!value) return null;
    const date = new Date(value + 'T00:00:00');
    return isNaN(date.getTime()) ? null : date;
  };

  const validateDateRange = useCallback(
    (start: Date | null, end: Date | null): boolean => {
      if (start && end && end < start) {
        setValidationError('End date must be after start date');
        return false;
      }
      setValidationError(null);
      return true;
    },
    []
  );

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseDateFromInput(event.target.value);
    if (validateDateRange(newStart, endDate)) {
      onDateRangeChange(newStart, endDate);
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseDateFromInput(event.target.value);
    if (validateDateRange(startDate, newEnd)) {
      onDateRangeChange(startDate, newEnd);
    }
  };

  const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(event.target.value, 10);
    if (selectedIndex === -1) {
      setValidationError(null);
      onDateRangeChange(null, null);
      return;
    }
    const preset = presetOptions[selectedIndex];
    if (preset) {
      const { start, end } = preset.getValue();
      setValidationError(null);
      onDateRangeChange(start, end);
    }
  };

  const getCurrentPresetIndex = (): number => {
    if (!startDate || !endDate) return -1;
    for (let i = 0; i < presetOptions.length; i++) {
      const { start, end } = presetOptions[i].getValue();
      if (
        formatDateForInput(start) === formatDateForInput(startDate) &&
        formatDateForInput(end) === formatDateForInput(endDate)
      ) {
        return i;
      }
    }
    return -1;
  };

  const handleClearDates = () => {
    setValidationError(null);
    onDateRangeChange(null, null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row flex-wrap gap-2 items-center max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
        <label htmlFor="preset-select" className="text-xs font-semibold text-leafy-green hidden max-sm:block max-sm:mb-1">
          Date Range
        </label>
        <select
          id="preset-select"
          className={`${inputBase} w-[130px] sm:w-[140px]`}
          value={getCurrentPresetIndex()}
          onChange={handlePresetChange}
          aria-label="Select date range preset"
        >
          <option value={-1}>Custom</option>
          {presetOptions.map((option, index) => (
            <option key={option.label} value={index}>
              {option.label}
            </option>
          ))}
        </select>

        <label htmlFor="start-date" className="text-xs font-semibold text-leafy-green hidden max-sm:block max-sm:mb-1">
          Start Date
        </label>
        <input
          type="date"
          id="start-date"
          className={`${inputBase} w-[120px] sm:w-[130px]`}
          value={formatDateForInput(startDate)}
          onChange={handleStartDateChange}
          aria-label="Start date"
        />

        <label htmlFor="end-date" className="text-xs font-semibold text-leafy-green hidden max-sm:block max-sm:mb-1">
          End Date
        </label>
        <input
          type="date"
          id="end-date"
          className={`${inputBase} w-[120px] sm:w-[130px] ${validationError ? 'border-red-700 focus:border-red-700 focus:ring-red-700/20' : ''}`}
          value={formatDateForInput(endDate)}
          onChange={handleEndDateChange}
          aria-label="End date"
          aria-invalid={!!validationError}
          aria-describedby={validationError ? 'date-error' : undefined}
        />

        {(startDate || endDate) && (
          <button
            type="button"
            className="h-[34px] px-2.5 text-xs font-semibold border-2 border-carrot-orange rounded-md bg-transparent text-carrot-orange cursor-pointer transition-all duration-200 hover:bg-carrot-orange hover:text-white focus:outline-none focus:ring-3 focus:ring-carrot-orange/20 max-sm:w-full max-sm:h-9"
            onClick={handleClearDates}
            aria-label="Clear date range"
          >
            Clear
          </button>
        )}
      </div>

      {validationError && (
        <div
          id="date-error"
          className="text-xs text-red-700 font-medium"
          role="alert"
          aria-live="polite"
        >
          {validationError}
        </div>
      )}
    </div>
  );
}

export default DateRangeFilter;
