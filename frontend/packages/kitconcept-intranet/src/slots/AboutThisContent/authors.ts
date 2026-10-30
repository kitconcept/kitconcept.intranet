type UserData = {
  fullname?: string;
  portrait?: string | null;
};

export type CLMAuthorData = {
  value: string;
  person_url?: string;
  title?: string;
  username?: string;
  portrait?: string | null;
};

type ContentAuthorData = {
  authors?: string[] | null;
  creators?: string[];
  '@components'?: {
    byline?: {
      users?: Record<string, UserData>;
    };
    clm?: {
      authors?: CLMAuthorData[];
    };
  };
};

export type DisplayedAuthor = {
  id: string;
  name: string;
  url?: string;
  portrait?: string;
};

export const getDisplayedAuthors = (
  content: ContentAuthorData,
): DisplayedAuthor[] => {
  const authorIds = content.authors ?? [];

  if (authorIds.length > 0) {
    const expandedAuthors = content['@components']?.clm?.authors ?? [];
    const expandedAuthorsById = new Map(
      expandedAuthors.map((author) => [author.value, author]),
    );

    return authorIds.map((uid) => {
      const author = expandedAuthorsById.get(uid);

      return {
        id: author?.username || uid,
        name: author?.title || author?.username || uid,
        url: author?.person_url,
        portrait: author?.portrait ?? undefined,
      };
    });
  }

  const usersFromExpander = content['@components']?.byline?.users ?? {};

  return (content.creators ?? []).map((userid) => {
    const userData = usersFromExpander[userid];

    return {
      id: userid,
      name: userData?.fullname || userid,
      portrait: userData?.portrait ?? undefined,
    };
  });
};
