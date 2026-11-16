/**
 * Eye icon for the watch toggle.
 *
 * Drawn inline instead of through Volto's Icon component and the SVG loader,
 * so the build cannot rewrite it: it always uses the text color
 * (`currentColor`) and keeps its cut-out iris and pupil.
 *
 * - outline: not watching
 * - filled: watching
 */
const OUTLINE =
  'M18 7.25C10 7.25 3.9 12.1 1 17.4L.7 18l.3.6c2.9 5.3 9 10.15 17 10.15S32.1 23.9 35 18.6l.3-.6-.3-.6C32.1 12.1 26 7.25 18 7.25Zm0 2.5c-6.5 0-11.7 3.85-14.4 8.25 2.7 4.4 7.9 8.25 14.4 8.25s11.7-3.85 14.4-8.25C29.7 13.6 24.5 9.75 18 9.75Zm0 1.75a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 2.25a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5Zm0 2.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z';

const FILLED =
  'M18 7.25C10 7.25 3.9 12.1 1 17.4L.7 18l.3.6c2.9 5.3 9 10.15 17 10.15S32.1 23.9 35 18.6l.3-.6-.3-.6C32.1 12.1 26 7.25 18 7.25Zm0 4.25a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z';

const EyeIcon = ({ filled = false, size = 24 }) => (
  <svg
    className="eye-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 36 36"
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d={filled ? FILLED : OUTLINE}
    />
  </svg>
);

export default EyeIcon;
