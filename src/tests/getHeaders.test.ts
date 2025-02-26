import { getHeaders } from '../utils';

describe('getHeaders', () => {
  it('should extract headers correctly', () => {
    const text = `# Header 1\nSome content\n## Header 2`;
    expect(getHeaders(text)).toEqual([
      { level: 1, text: 'Header 1', lineNumber: 0 },
      { level: 2, text: 'Header 2', lineNumber: 2 }
    ]);
  });

  it('should skip headers in code blocks', () => {
    const text = `# Header 1\n\`\`\`\n# This is a comment\n\`\`\`\n## Header 2`;
    expect(getHeaders(text)).toEqual([
      { level: 1, text: 'Header 1', lineNumber: 0 },
      { level: 2, text: 'Header 2', lineNumber: 4 }
    ]);
  });

  it('should skip lines starting with # in code blocks', () => {
    const text = `# Header 1\n\`\`\`python\n# Not a header\nSome code\n\`\`\`\n## Header 2`;
    expect(getHeaders(text)).toEqual([
      { level: 1, text: 'Header 1', lineNumber: 0 },
      { level: 2, text: 'Header 2', lineNumber: 5 }
    ]);
  });

  it('should handle unclosed code blocks', () => {
    const text = `# Header 1\n\`\`\`python\n# Not a header\nSome code\n# Still not a header`;
    expect(getHeaders(text)).toEqual([
      { level: 1, text: 'Header 1', lineNumber: 0 }
    ]);
  });

  it('should handle empty code blocks', () => {
    const text = `# Header 1\n\`\`\`\n\`\`\`\n## Header 2`;
    expect(getHeaders(text)).toEqual([
      { level: 1, text: 'Header 1', lineNumber: 0 },
      { level: 2, text: 'Header 2', lineNumber: 3 }
    ]);
  });

  it('should handle code blocks with language specification', () => {
    const text = `# Header 1\n\`\`\`typescript\n# Not a header\nconst x = 1;\n\`\`\`\n# Header 2`;
    expect(getHeaders(text)).toEqual([
      { level: 1, text: 'Header 1', lineNumber: 0 },
      { level: 1, text: 'Header 2', lineNumber: 5 }
    ]);
  });
}); 