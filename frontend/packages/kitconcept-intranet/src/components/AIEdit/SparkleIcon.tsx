/**
 * Sparkle icon of the AI assistant, same as the one of the AI Overview in the
 * search dialog (components/Header/HeaderSearch.tsx). Kept separate so the
 * assistant does not touch the search.
 */
type SparkleIconProps = {
  className?: string;
  size?: number;
};

const SparkleIcon = ({ className, size = 15 }: SparkleIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M12 2l2.09 5.66L20 9.75l-5.91 2.09L12 17.5l-2.09-5.66L4 9.75l5.91-2.09L12 2zm7 11l1.19 3.22L23.5 17.4l-3.31 1.18L19 21.8l-1.19-3.22-3.31-1.18 3.31-1.18L19 13z"
    />
  </svg>
);

export default SparkleIcon;
