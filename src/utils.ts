export function splitMarkdownByHeaders(text: string): string[] {
  if (!text || !text.includes('#')) return [];
  
  const lines = text.split('\n');
  const segments: string[] = [];
  let currentSegment: string[] = [];
  let isFirstSegment = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/^#{1,6}\s/)) {  // 使用正则来匹配标题格式
      // 如果已经有内容，保存当前片段
      if (currentSegment.length > 0) {
        segments.push(currentSegment.join('\n'));
        currentSegment = [];
      }
      isFirstSegment = false;
      // 开始新片段
      currentSegment.push(line);
    } else {
      // 如果是第一个非空行且不是以#开头，作为独立片段
      if (isFirstSegment && line.trim()) {
        if (currentSegment.length > 0) {
          currentSegment.push(line);
        } else {
          currentSegment = [line];
        }
      } else if (currentSegment.length > 0) {
        // 将非标题行添加到当前片段
        currentSegment.push(line);
      }
    }
  }
  
  // 添加最后一个片段
  if (currentSegment.length > 0) {
    segments.push(currentSegment.join('\n'));
  }
  
  // 如果无法分割成多个片段，返回空数组
  if (segments.length <= 1) {
    return [];
  }
  
  return segments;
} 