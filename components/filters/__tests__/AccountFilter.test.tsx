// Unit tests for AccountFilter component

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountFilter } from '../AccountFilter';

describe('AccountFilter', () => {
  const mockAccounts = ['account-1', 'account-2', 'account-3'];

  it('renders with "All Accounts" option', () => {
    const onAccountChange = vi.fn();
    render(
      <AccountFilter
        accounts={mockAccounts}
        selectedAccount={null}
        onAccountChange={onAccountChange}
      />
    );

    const select = screen.getByRole('combobox', { name: /filter by account/i });
    expect(select).toBeDefined();
    
    const allAccountsOption = screen.getByRole('option', { name: /all accounts/i });
    expect(allAccountsOption).toBeDefined();
  });

  it('renders all account options', () => {
    const onAccountChange = vi.fn();
    render(
      <AccountFilter
        accounts={mockAccounts}
        selectedAccount={null}
        onAccountChange={onAccountChange}
      />
    );

    mockAccounts.forEach((account) => {
      const option = screen.getByRole('option', { name: account });
      expect(option).toBeDefined();
    });
  });

  it('shows selected account as current value', () => {
    const onAccountChange = vi.fn();
    render(
      <AccountFilter
        accounts={mockAccounts}
        selectedAccount="account-2"
        onAccountChange={onAccountChange}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('account-2');
  });

  it('calls onAccountChange with account id when account is selected', () => {
    const onAccountChange = vi.fn();
    render(
      <AccountFilter
        accounts={mockAccounts}
        selectedAccount={null}
        onAccountChange={onAccountChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'account-1' } });

    expect(onAccountChange).toHaveBeenCalledWith('account-1');
  });

  it('calls onAccountChange with null when "All Accounts" is selected', () => {
    const onAccountChange = vi.fn();
    render(
      <AccountFilter
        accounts={mockAccounts}
        selectedAccount="account-1"
        onAccountChange={onAccountChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '' } });

    expect(onAccountChange).toHaveBeenCalledWith(null);
  });

  it('renders with empty accounts array', () => {
    const onAccountChange = vi.fn();
    render(
      <AccountFilter
        accounts={[]}
        selectedAccount={null}
        onAccountChange={onAccountChange}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();
    
    // Should only have "All Accounts" option
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(1);
  });

  it('has accessible aria-label for screen readers', () => {
    const onAccountChange = vi.fn();
    render(
      <AccountFilter
        accounts={mockAccounts}
        selectedAccount={null}
        onAccountChange={onAccountChange}
      />
    );

    // Uses aria-label instead of visible label for compact layout
    const select = screen.getByRole('combobox', { name: /filter by account/i });
    expect(select).toBeDefined();
    expect(select.getAttribute('aria-label')).toBe('Filter by account');
  });
});
