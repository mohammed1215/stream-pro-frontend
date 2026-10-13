export const MAX_TAGS = 10

export const normalizeTagList = (
  list: Array<string | { name?: string }> | undefined
): string[] => {
  if (!list) return []
  return list
    .map((t) => (typeof t === "string" ? t : t?.name))
    .filter((name): name is string => Boolean(name))
}
