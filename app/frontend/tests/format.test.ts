import { describe, expect, it } from 'vitest';
import { formatJPY, formatCompact } from '../utils/format';

describe('formatJPY', () => {
  it('整数を ¥ 区切りでフォーマットする', () => {
    expect(formatJPY(1500000)).toBe('¥1,500,000');
    expect(formatJPY(0)).toBe('¥0');
    expect(formatJPY(1234)).toBe('¥1,234');
  });

  it('負の数は先頭に - を付ける', () => {
    expect(formatJPY(-3000)).toBe('-¥3,000');
    expect(formatJPY(-1234567)).toBe('-¥1,234,567');
  });

  it('小数は四捨五入される', () => {
    expect(formatJPY(1234.7)).toBe('¥1,235');
    expect(formatJPY(1234.4)).toBe('¥1,234');
  });

  it('NaN / Infinity は ¥0 になる', () => {
    expect(formatJPY(NaN)).toBe('¥0');
    expect(formatJPY(Infinity)).toBe('¥0');
    expect(formatJPY(-Infinity)).toBe('¥0');
  });
});

describe('formatCompact', () => {
  it('1万未満は「円」', () => {
    expect(formatCompact(0)).toBe('0円');
    expect(formatCompact(9999)).toBe('9,999円');
  });

  it('1万以上 1億未満は「万円」', () => {
    expect(formatCompact(10000)).toBe('1万円');
    expect(formatCompact(1500000)).toBe('150万円');
    expect(formatCompact(99999999)).toBe('9,999万円');
  });

  it('1億以上は「億円」', () => {
    expect(formatCompact(100000000)).toBe('1.00億円');
    expect(formatCompact(123456789)).toBe('1.23億円');
    expect(formatCompact(1234567890)).toBe('12.35億円');
  });

  it('負の数は先頭に - を付ける', () => {
    expect(formatCompact(-1500000)).toBe('-150万円');
    expect(formatCompact(-100000000)).toBe('-1.00億円');
  });

  it('NaN は 0円 になる', () => {
    expect(formatCompact(NaN)).toBe('0円');
  });
});
