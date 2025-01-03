import { splitMarkdownByHeaders } from '../utils';

describe('splitMarkdownByHeaders', () => {
  it('should not split cell that starts with header', () => {
    const text = '# Header\nSome content\n## Subheader\nMore content';
    expect(splitMarkdownByHeaders(text)).toEqual([]);
  });

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

  it('should handle cell with no headers', () => {
    const text = 'Just some content\nwithout any headers';
    expect(splitMarkdownByHeaders(text)).toEqual([
      'Just some content\nwithout any headers'
    ]);
  });

  it('should handle empty cell', () => {
    expect(splitMarkdownByHeaders('')).toEqual(['']);
  });
}); 