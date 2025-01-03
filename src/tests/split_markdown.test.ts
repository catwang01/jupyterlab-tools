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
    expect(splitMarkdownByHeaders(text)).toEqual([]);
  });

  it('should split cell with only one potential split point', () => {
    const text = 'Initial content\n# Header\nSome content';
    expect(splitMarkdownByHeaders(text)).toEqual(["Initial content", "# Header\nSome content"]);
  });

  it('should handle empty cell', () => {
    expect(splitMarkdownByHeaders('')).toEqual([]);
  });
}); 