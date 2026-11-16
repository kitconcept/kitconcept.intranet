import {
  avatarToneClass,
  getInitials,
} from '@kitconcept/volto-plate/helpers/avatar';

type Props = { title: string; size?: number };

// Letter avatar for a workspace, tinted by the shared avatar palette
// from volto-plate, keyed by the workspace title so a workspace has the
// same color everywhere. There is no image avatar on Workspace.
export default function WorkspaceMarker({ title, size = 22 }: Props) {
  const initials = getInitials(title);
  return (
    <span
      className={`workspace-marker header-search-scope-avatar ${avatarToneClass(title || initials)}`}
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }}
    >
      {initials[0]}
    </span>
  );
}
