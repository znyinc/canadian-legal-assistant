export function needGoToCourt(forumMap: any): { need: boolean; reason: string } {
  if (!forumMap || !forumMap.primaryForum) {
    return { need: false, reason: 'No forum recommendation available' };
  }

  const primary = forumMap.primaryForum;
  if (primary.type === 'court') {
    return { need: true, reason: `Primary forum is a court: ${primary.name}` };
  }

  return { need: false, reason: `Primary forum is ${primary.type}: ${primary.name}` };
}
