export function splitMarkdownByHeaders(text: string): string[] {
  const lines = text.split('\n');
  
  // 如果第一行就是标题，不处理
  if (lines[0] && lines[0].match(/^#{1,6}\s/)) {
    return [];
  }

  const cells: string[] = [];
  let currentCell: string[] = [];

  lines.forEach(line => {
    if (line.match(/^#{1,6}\s/) && currentCell.length > 0) {
      cells.push(currentCell.join('\n'));
      currentCell = [];
    }
    currentCell.push(line);
  });

  if (currentCell.length > 0) {
    cells.push(currentCell.join('\n'));
  }

  return cells;
} 