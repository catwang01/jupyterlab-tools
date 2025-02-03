import { splitMarkdownByHeaders } from '../utils';

describe('splitMarkdownByHeaders', () => {
  it('should split cell with content before headers', () => {
    const text = 'Initial content\n# Header\nSome content\n## Subheader\nMore content';
    expect(splitMarkdownByHeaders(text)).toEqual([
      'Initial content',
      '# Header\nSome content',
      '## Subheader\nMore content'
    ]);
  });

  it('should handle empty lines correctly', () => {
    const text = 'Initial content\n\n# Header\n\nSome content\n\n## Subheader\n\nMore content';
    expect(splitMarkdownByHeaders(text)).toEqual([
      'Initial content\n',
      '# Header\n\nSome content\n',
      '## Subheader\n\nMore content'
    ]);
  });

  it('should not split cell with no headers', () => {
    const text = 'Just some content\nwithout any headers';
    expect(splitMarkdownByHeaders(text)).toEqual([]);
  });

  it('should split cell with more than one potential split points', () => {
    const text = 'Initial content\n# Header\n# Some content';
    expect(splitMarkdownByHeaders(text)).toEqual(["Initial content", "# Header", "# Some content"]);
  });

  it('should split cell with only start with one potential split point', () => {
    const text = '# Header\nInitial content\n\nSome content';
    expect(splitMarkdownByHeaders(text)).toEqual([
      '# Header\nInitial content\n\nSome content'
    ]);
  });

  it('should split cell with only one potential split point', () => {
    const text = 'Initial content\n# Header\nSome content';
    expect(splitMarkdownByHeaders(text)).toEqual(["Initial content", "# Header\nSome content"]);
  });

  it('should handle empty cell', () => {
    expect(splitMarkdownByHeaders('')).toEqual([]);
  });

  it('should not split headers in code blocks', () => {
    const text = `Initial content
# Real Header 1
\`\`\`python
# This is a comment
def foo():
    # Another comment
    pass
\`\`\`
# Real Header 2`;
    expect(splitMarkdownByHeaders(text)).toEqual([
      'Initial content',
      '# Real Header 1\n```python\n# This is a comment\ndef foo():\n    # Another comment\n    pass\n```',
      '# Real Header 2'
    ]);
  });

  it('should handle nested code blocks correctly', () => {
    const text = `# Header 1
Some text with \`inline code # not a header\`
\`\`\`
# Not a header in code block
\`\`\`
# Header 2`;
    expect(splitMarkdownByHeaders(text)).toEqual([
      '# Header 1\nSome text with `inline code # not a header`\n```\n# Not a header in code block\n```',
      '# Header 2'
    ]);
  });

  it('should handle multiple code blocks', () => {
    const text = `# First Header
\`\`\`js
# Comment 1
\`\`\`
Some text
\`\`\`python
# Comment 2
\`\`\`
# Second Header`;
    expect(splitMarkdownByHeaders(text)).toEqual([
      '# First Header\n```js\n# Comment 1\n```\nSome text\n```python\n# Comment 2\n```',
      '# Second Header'
    ]);
  });

  it('should handle unclosed code blocks', () => {
    const text = `# Header 1
\`\`\`python
# Not a header
Some code
# Still not a header`;
    expect(splitMarkdownByHeaders(text)).toEqual([
      '# Header 1\n```python\n# Not a header\nSome code\n# Still not a header'
    ]);
  });

  it('should handle empty code blocks', () => {
    const text = `# Header 1
\`\`\`
\`\`\`
# Header 2`;
    expect(splitMarkdownByHeaders(text)).toEqual([
      '# Header 1\n```\n```',
      '# Header 2'
    ]);
  });

  it('should handle code blocks with language specification', () => {
    const text = `# Header 1
\`\`\`typescript
# Not a header
const x = 1;
\`\`\`
# Header 2`;
    expect(splitMarkdownByHeaders(text)).toEqual([
      '# Header 1\n```typescript\n# Not a header\nconst x = 1;\n```',
      '# Header 2'
    ]);
  });
}); 