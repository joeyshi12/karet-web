'use client';

import React from 'react';

interface AccountFilterProps {
  accounts: string[];
  selectedAccount: string | null;
  onAccountChange: (account: string | null) => void;
}

/**
 * AccountFilter component displays a compact dropdown with all unique account_id values
 * and an "All Accounts" option for viewing combined data.
 */
export function AccountFilter({
  accounts,
  selectedAccount,
  onAccountChange,
}: AccountFilterProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onAccountChange(value === '' ? null : value);
  };

  return (
    <div className="inline-flex items-center">
      <select
        id="account-select"
        className="h-[34px] px-3 text-sm border-2 border-carrot-orange rounded-lg bg-soft-cream text-gray-800 cursor-pointer transition-all duration-200 min-w-[140px] hover:border-leafy-green focus:outline-none focus:border-leafy-green focus:ring-3 focus:ring-leafy-green/20"
        value={selectedAccount ?? ''}
        onChange={handleChange}
        aria-label="Filter by account"
      >
        <option value="">All Accounts</option>
        {accounts.map((account) => (
          <option key={account} value={account}>
            {account}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AccountFilter;
