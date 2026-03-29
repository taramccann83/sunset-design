import { type InputHTMLAttributes } from 'react'

interface SearchInputProps extends Pick<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 font-sans text-base bg-surface-container-high text-on-surface rounded-t-lg border-0 border-b-[3px] border-outline-variant focus:border-tertiary focus:outline-none transition-colors duration-300 placeholder:text-on-surface-variant/50"
      />
    </div>
  )
}
