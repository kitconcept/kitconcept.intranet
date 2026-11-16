// Whether the pathname is the (solr) search page, e.g. `/search`.
export const isSearchPath = (pathname: string) =>
  /\/(@@)?search$/.test(pathname);
