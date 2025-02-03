export function splitMarkdownByHeaders(text: string): string[] {
  if (!text || !text.includes('#')) return [];
  
  const lines = text.split('\n');
  const segments: string[] = [];
  let currentSegment: string[] = [];
  let isFirstSegment = true;
  let inCodeBlock = false;  // 跟踪是否在代码块内
  let foundFirstHeader = false;  // 跟踪是否找到第一个标题
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检查是否进入或离开代码块
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentSegment.length > 0) {
        currentSegment.push(line);
      } else if (isFirstSegment) {
        currentSegment = [line];
      }
      continue;
    }
    
    // 只有在不在代码块内时才检查标题
    if (!inCodeBlock && line.match(/^#{1,6}\s/)) {
      if (!foundFirstHeader) {
        foundFirstHeader = true;
        if (currentSegment.length > 0) {
          segments.push(currentSegment.join('\n'));
          currentSegment = [];
        }
      } else {
        // 如果已经找到过标题，这是第二个或之后的标题
        if (currentSegment.length > 0) {
          segments.push(currentSegment.join('\n'));
          currentSegment = [];
        }
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
  
  // 如果找到了标题，返回所有片段；否则返回空数组
  return foundFirstHeader ? segments : [];
}

export interface HeaderInfo {
  level: number;
  text: string;
  lineNumber: number;
}

export function getHeaders(text: string): HeaderInfo[] {
  const lines = text.split('\n');
  const headers: HeaderInfo[] = [];
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,8})\s+(.+)$/);
    if (match) {
      headers.push({
        level: match[1].length,
        text: match[2],
        lineNumber: index
      });
    }
  });
  
  return headers;
} 