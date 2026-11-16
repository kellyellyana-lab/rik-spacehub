import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeMap = {
    sm: 'px-3 py-1.5 text-xs font-medium',
    md: 'px-4 py-2 text-sm font-medium',
    lg: 'px-5 py-2.5 text-base font-semibold',
  };

  const variantMap = {
    primary:
      'bg-[#1B4332] text-white hover:bg-[#132A13] focus:ring-emerald-800 shadow-sm border border-[#132A13]',
    secondary:
      'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#B7E4C7] focus:ring-[#52B788] border border-[#B7E4C7]',
    outline:
      'bg-white text-stone-700 hover:bg-stone-50 border border-stone-300 focus:ring-emerald-800',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600 border border-rose-700',
    ghost:
      'bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900 border-transparent',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${sizeMap[size]} ${variantMap[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
