import { describe, it, expect, beforeEach } from 'vitest';

describe('utils/keys patterns high coverage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('specific vendor matches suppress generic and fallback (OpenAI + Gemini present)', async () => {
    await import('../../js/utils/keys.js');
    const { extractKeysFromContent } = window;
    const openaiKey = 'sk-' + 'a'.repeat(28) + '12';
    const geminiKey = 'AIzaSy' + 'A'.repeat(29) + '9';
    const genericKey = 'token_' + 'b'.repeat(22);
    const fallback = 'abc123' + 'x'.repeat(20) + '0z';
    const content = `xx ${openaiKey} yy ${geminiKey} zz ${genericKey} uu ${fallback}`;
    const keys = extractKeysFromContent(content);
    expect(keys).toEqual([openaiKey, geminiKey]);
  });

  it('includes cohere-like (40+) and anthropic-like (32+) tokens at specific layer', async () => {
    await import('../../js/utils/keys.js');
    const { extractKeysFromContent } = window;
    const cohereLike = 'C'.repeat(39) + '1'; // 40+ alnum
    const anthropicLike = 'D'.repeat(31) + '2'; // 32+ alnum
    const content = `prefix ${cohereLike} mid ${anthropicLike}`;
    const keys = extractKeysFromContent(content);
    expect(keys).toEqual([cohereLike, anthropicLike]);
  });

  it('generic triggers only when no specific matches', async () => {
    await import('../../js/utils/keys.js');
    const { extractKeysFromContent } = window;
    const generic1 = 'api_' + 'x'.repeat(21);
    const generic2 = 'pk-' + 'Y'.repeat(25);
    const keys = extractKeysFromContent(`p ${generic1} q ${generic2}`);
    expect(keys).toEqual([generic1, generic2]);
  });

  it('fallback triggers only when no specific or generic matches and enforces mixed char types', async () => {
    await import('../../js/utils/keys.js');
    const { extractKeysFromContent } = window;
    const mixed = 'abc123' + 'K'.repeat(19) + '7'; // >=25 and mixed
    const pureLetters = 'a'.repeat(30);
    const pureDigits = '1'.repeat(30);
    const keys = extractKeysFromContent(`A ${mixed} B ${pureLetters} C ${pureDigits}`);
    expect(keys).toEqual([mixed]);
  });

  it('dedup and preserve order when same key appears multiple times', async () => {
    await import('../../js/utils/keys.js');
    const { extractKeysFromContent } = window;
    const openaiKey = 'sk-' + 'q'.repeat(28) + '12';
    const content = `${openaiKey} ... ${openaiKey} ... ${openaiKey}`;
    const keys = extractKeysFromContent(content);
    expect(keys).toEqual([openaiKey]);
  });

  it('enforces maximum length limit: very long token is rejected', async () => {
    await import('../../js/utils/keys.js');
    const { extractKeysFromContent } = window;
    const veryLong = 'token_' + 'Z'.repeat(500) + '1';
    const keys = extractKeysFromContent(veryLong);
    expect(keys).toEqual([]);
  });
});


