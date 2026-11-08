const paths = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v12h14V9M9 21v-8h6v8" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  book: (
    <path d="M12 5C8 2 3 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-2-7-1-10 1v15" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M1 21v-2a7 7 0 0 1 14 0v2M16 5a4 4 0 0 1 0 8M18 16a5 5 0 0 1 5 5" />
    </>
  ),
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  siren: (
    <path d="M5 17V10a7 7 0 0 1 14 0v7M3 17h18v4H3zM12 0v2M3 3l2 2M21 3l-2 2M0 10h3M21 10h3" />
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  sparkles: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3zM21 1v5M18.5 3.5h5" />,
  chat: (
    <>
      <path d="M20 10a9 8 0 0 1-14 7L1 19l2-5a8 8 0 1 1 17-4ZM20 14a6 6 0 0 1 1 8l-4-2" />
      <circle cx="6" cy="10" r=".5" />
      <circle cx="10" cy="10" r=".5" />
      <circle cx="14" cy="10" r=".5" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  play: <path d="m7 3 14 9-14 9z" />,
  rocket: (
    <>
      <path d="M10 6c3-4 8-4 11-3 1 4-1 9-5 12l-4-4zM10 6 4 7l-2 5 7 1M16 15l-1 6-5 1-1-7M5 17l-3 5 5-3" />
      <circle cx="16" cy="7" r="2" />
    </>
  ),
  close: <path d="m5 5 14 14M19 5 5 19" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
};
export function Icon({ name, size = 24, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.shield}
    </svg>
  );
}
export function Lotus({ size = 58 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M32 48C15 37 23 13 32 3c11 14 17 32 0 45ZM32 48C10 48 7 29 9 13c17 4 25 19 23 35ZM32 48c22 0 25-19 23-35-17 4-25 19-23 35ZM32 48C13 53 4 46 1 33c12-2 23 3 31 15ZM32 48c19 5 28-2 31-15-12-2-23 3-31 15Z" />
    </svg>
  );
}
