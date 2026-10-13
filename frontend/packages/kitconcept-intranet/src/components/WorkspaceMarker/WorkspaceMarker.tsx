type Props = { title: string; size?: number };

/** Use the same deterministic workspace colors as the search scope menu. */
export function avatarTone(title: string) {
  let tone = 0;
  for (let i = 0; i < title.length; i += 1) {
    tone = (tone * 31 + title.charCodeAt(i)) % 6;
  }
  return tone;
}

export default function WorkspaceMarker({ title, size = 22 }: Props) {
  return (
    <span
      className={`workspace-marker header-search-scope-avatar tone-${avatarTone(title)}`}
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
    >
      {title.trim().charAt(0).toUpperCase()}
    </span>
  );
}
