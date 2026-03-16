'use client';

import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
}

export function SummaryCard({ title, value, icon }: SummaryCardProps) {
  return (
    <div className="w-full rounded-lg md:rounded-[10px] lg:rounded-xl bg-soft-cream p-2 md:p-2.5 lg:p-3 shadow-sm border border-carrot-orange/[0.08] transition-all duration-200 hover:-translate-y-px hover:shadow-md">
      <div className="flex items-center gap-1.5">
        {icon && (
          <div className="flex items-center justify-center w-5 h-5 rounded bg-carrot-orange/[0.08] text-carrot-orange shrink-0">
            {icon}
          </div>
        )}
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="text-base md:text-[17px] lg:text-lg font-bold text-leafy-green break-words">
        {value}
      </div>
    </div>
  );
}

export default SummaryCard;
