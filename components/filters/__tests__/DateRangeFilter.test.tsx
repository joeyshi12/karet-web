// /components/filters/__tests__/DateRangeFilter.test.tsx
// Unit tests for DateRangeFilter component
// Validates: Requirements 7.1, 7.4, 7.5

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangeFilter } from '../DateRangeFilter';

describe('DateRangeFilter', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders date picker controls for start and end dates', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={null}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    expect(startDateInput).toBeDefined();
    expect(endDateInput).toBeDefined();
  });

  it('renders preset date range options', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={null}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const presetSelect = screen.getByLabelText(/select date range preset/i);
    expect(presetSelect).toBeDefined();

    // Check for preset options
    expect(screen.getByRole('option', { name: /last 30 days/i })).toBeDefined();
    expect(screen.getByRole('option', { name: /last 3 months/i })).toBeDefined();
    expect(screen.getByRole('option', { name: /last 6 months/i })).toBeDefined();
    expect(screen.getByRole('option', { name: /last year/i })).toBeDefined();
  });

  it('calls onDateRangeChange when "Last 30 days" preset is selected', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={null}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const presetSelect = screen.getByLabelText(/select date range preset/i);
    fireEvent.change(presetSelect, { target: { value: '0' } }); // Index 0 = Last 30 days

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    const [start, end] = onDateRangeChange.mock.calls[0];
    
    // Verify the date range is approximately 30 days
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(end.getTime() - start.getTime()).toBeGreaterThanOrEqual(29 * 24 * 60 * 60 * 1000);
  });

  it('calls onDateRangeChange when "Last 3 months" preset is selected', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={null}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const presetSelect = screen.getByLabelText(/select date range preset/i);
    fireEvent.change(presetSelect, { target: { value: '1' } }); // Index 1 = Last 3 months

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    const [start, end] = onDateRangeChange.mock.calls[0];
    
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
  });

  it('calls onDateRangeChange when start date is changed', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={null}
        endDate={new Date('2024-06-15')}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const startDateInput = screen.getByLabelText(/start date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    const [start] = onDateRangeChange.mock.calls[0];
    expect(start).toBeInstanceOf(Date);
    expect(start.getFullYear()).toBe(2024);
    expect(start.getMonth()).toBe(0); // January
    expect(start.getDate()).toBe(1);
  });

  it('calls onDateRangeChange when end date is changed', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={new Date('2024-01-01')}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const endDateInput = screen.getByLabelText(/end date/i);
    fireEvent.change(endDateInput, { target: { value: '2024-06-15' } });

    expect(onDateRangeChange).toHaveBeenCalledTimes(1);
    const [, end] = onDateRangeChange.mock.calls[0];
    expect(end).toBeInstanceOf(Date);
    expect(end.getFullYear()).toBe(2024);
    expect(end.getMonth()).toBe(5); // June
    expect(end.getDate()).toBe(15);
  });

  it('displays validation error when end date is before start date', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={new Date('2024-06-15')}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const endDateInput = screen.getByLabelText(/end date/i);
    fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });

    // Should display validation error
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeDefined();
    expect(errorMessage.textContent).toContain('End date must be after start date');

    // Should not call onDateRangeChange with invalid range
    expect(onDateRangeChange).not.toHaveBeenCalled();
  });

  it('shows current date values in inputs', () => {
    const onDateRangeChange = vi.fn();
    // Use explicit time to avoid timezone issues
    const startDate = new Date('2024-03-01T12:00:00');
    const endDate = new Date('2024-06-15T12:00:00');

    render(
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;

    expect(startDateInput.value).toBe('2024-03-01');
    expect(endDateInput.value).toBe('2024-06-15');
  });

  it('shows clear button when dates are selected', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={new Date('2024-01-01')}
        endDate={new Date('2024-06-15')}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeDefined();
  });

  it('clears dates when clear button is clicked', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={new Date('2024-01-01')}
        endDate={new Date('2024-06-15')}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(onDateRangeChange).toHaveBeenCalledWith(null, null);
  });

  it('does not show clear button when no dates are selected', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={null}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const clearButton = screen.queryByRole('button', { name: /clear/i });
    expect(clearButton).toBeNull();
  });

  it('has accessible labels', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={null}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    expect(screen.getByText('Date Range')).toBeDefined();
    expect(screen.getByText('Start Date')).toBeDefined();
    expect(screen.getByText('End Date')).toBeDefined();
  });

  it('includes Custom option in preset dropdown', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={null}
        endDate={null}
        onDateRangeChange={onDateRangeChange}
      />
    );

    expect(screen.getByRole('option', { name: /custom/i })).toBeDefined();
  });

  it('clears dates when Custom preset is selected', () => {
    const onDateRangeChange = vi.fn();
    render(
      <DateRangeFilter
        startDate={new Date('2024-01-01')}
        endDate={new Date('2024-06-15')}
        onDateRangeChange={onDateRangeChange}
      />
    );

    const presetSelect = screen.getByLabelText(/select date range preset/i);
    fireEvent.change(presetSelect, { target: { value: '-1' } }); // Custom option

    expect(onDateRangeChange).toHaveBeenCalledWith(null, null);
  });
});
