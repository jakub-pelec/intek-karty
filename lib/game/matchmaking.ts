export function pickClosestOpponent<T extends { id: string; rating: number }>(
  myId: string,
  myRating: number,
  candidates: T[],
): T | null {
  const others = candidates.filter((candidate) => candidate.id !== myId);
  if (others.length === 0) return null;
  others.sort((a, b) => {
    const diffA = Math.abs(a.rating - myRating);
    const diffB = Math.abs(b.rating - myRating);
    if (diffA !== diffB) return diffA - diffB;
    return a.id.localeCompare(b.id);
  });
  return others[0] ?? null;
}
