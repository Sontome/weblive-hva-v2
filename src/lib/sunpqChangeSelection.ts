/** Preserve original segment references while selecting up to two segments. */
export function toggleSunSegment<T>(selected: T[], segment: T): T[] {
  if (selected.includes(segment)) return selected.filter((item) => item !== segment);
  return selected.length < 2 ? [...selected, segment] : selected;
}

export function hasMatchedSunSegments<T, U>(oldSegments: T[], newSegments: U[]): boolean {
  return oldSegments.length >= 1 && oldSegments.length <= 2 &&
    oldSegments.length === newSegments.length &&
    new Set(oldSegments).size === oldSegments.length &&
    new Set(newSegments).size === newSegments.length;
}

/** Direction groups are always [outbound, return], with original itinerary order. */
export function pairSunChangeSegments<T, U>(
  oldSelected: T[], newSelected: U[], oldGroups: T[][], newGroups: U[][],
) {
  const oldSegments = oldGroups.flat().filter((segment) => oldSelected.includes(segment));
  const newSegments = newGroups.flat().filter((segment) => newSelected.includes(segment));
  const complete = oldSegments.length === oldSelected.length && newSegments.length === newSelected.length;
  const directionsMatch = oldSelected.length !== 2 || oldGroups.every((group, index) =>
    group.filter((segment) => oldSelected.includes(segment)).length ===
    (newGroups[index] ?? []).filter((segment) => newSelected.includes(segment)).length
  );
  return { oldSegments, newSegments, matched: complete && directionsMatch && hasMatchedSunSegments(oldSegments, newSegments) };
}

export function buildSunChangePayload<T, U>(pnr: string, oldSegments: T[], newSegments: U[]) {
  if (!hasMatchedSunSegments(oldSegments, newSegments)) {
    throw new Error('Chọn đủ 1 hoặc 2 cặp chặng cũ và mới tương ứng');
  }
  return { pnr, old_itinerary: [...oldSegments], new_itinerary: [...newSegments] };
}
