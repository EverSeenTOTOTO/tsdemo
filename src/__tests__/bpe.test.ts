import { NaiveBPE, GPT2BPE } from '@/LLM/ch02/bpe';
import * as path from 'path';

const GPT2_ENCODER_PATH = path.join(
  __dirname,
  '../LLM/ch02/gpt2_model/encoder.json',
);
const GPT2_VOCAB_PATH = path.join(
  __dirname,
  '../LLM/ch02/gpt2_model/vocab.bpe',
);

describe('NaiveBPE', () => {
  describe('train', () => {
    test('should train on simple corpus', () => {
      const bpe = new NaiveBPE(50);
      bpe.train('aa ab aa ab');

      expect(bpe.getVocabSize()).toBeGreaterThan(0);
      expect(bpe.getMerges().length).toBeGreaterThan(0);
    });

    test('should merge most frequent pairs first', () => {
      const bpe = new NaiveBPE(50);
      // 'aa' appears 4 times, 'ab' appears 2 times
      bpe.train('aaaa ab aaaa ab');

      const merges = bpe.getMerges();
      // First merge should be 'a a' -> 'aa' (most frequent)
      expect(merges[0]).toBe('a a');
    });

    test('should build vocabulary from corpus', () => {
      const bpe = new NaiveBPE(100);
      bpe.train('hello world');

      const vocab = bpe.getVocab();
      expect(vocab.has('h')).toBe(true);
      expect(vocab.has('e')).toBe(true);
      expect(vocab.has('l')).toBe(true);
    });
  });

  describe('encode', () => {
    test('should encode text after training', () => {
      const bpe = new NaiveBPE(50);
      bpe.train('aa ab aa ab');

      const encoded = bpe.encode('aa ab');
      expect(encoded).toBeInstanceOf(Array);
      expect(encoded.length).toBeGreaterThan(0);
    });

    test('should encode same text to same tokens', () => {
      const bpe = new NaiveBPE(50);
      bpe.train('the cat sat on the mat');

      const encoded1 = bpe.encode('the cat');
      const encoded2 = bpe.encode('the cat');

      expect(encoded1).toEqual(encoded2);
    });

    test('should handle repeated patterns', () => {
      const bpe = new NaiveBPE(100);
      bpe.train('abababababababababab');

      const encoded = bpe.encode('abab');
      expect(encoded.length).toBeLessThan(4); // Should be compressed
    });
  });

  describe('decode', () => {
    test('should decode encoded text back to original', () => {
      const bpe = new NaiveBPE(100);
      const corpus = 'hello world hello';
      bpe.train(corpus);

      const encoded = bpe.encode('hello');
      const decoded = bpe.decode(encoded);

      expect(decoded).toBe('hello');
    });

    test('should handle round-trip encoding', () => {
      const bpe = new NaiveBPE(100);
      bpe.train('the quick brown fox jumps over the lazy dog');

      const texts = ['the quick', 'brown fox', 'lazy dog'];

      for (const text of texts) {
        const encoded = bpe.encode(text);
        const decoded = bpe.decode(encoded);
        expect(decoded).toBe(text);
      }
    });
  });

  describe('export/import', () => {
    test('should export and import model', () => {
      const bpe1 = new NaiveBPE(50);
      bpe1.train('aa ab aa ab ac ad');

      const model = bpe1.export();

      const bpe2 = new NaiveBPE();
      bpe2.import(model);

      expect(bpe2.getVocabSize()).toBe(bpe1.getVocabSize());
      expect(bpe2.getMerges()).toEqual(bpe1.getMerges());
    });

    test('should produce same encoding after import', () => {
      const bpe1 = new NaiveBPE(50);
      bpe1.train('the cat in the hat');

      const encoded1 = bpe1.encode('the cat');

      const model = bpe1.export();
      const bpe2 = new NaiveBPE();
      bpe2.import(model);

      const encoded2 = bpe2.encode('the cat');
      expect(encoded1).toEqual(encoded2);
    });
  });

  describe('edge cases', () => {
    test('should handle empty string', () => {
      const bpe = new NaiveBPE(50);
      bpe.train('abc');

      expect(bpe.encode('')).toEqual([]);
      expect(bpe.decode([])).toBe('');
    });

    test('should handle single character', () => {
      const bpe = new NaiveBPE(50);
      bpe.train('a b c');

      const encoded = bpe.encode('a');
      const decoded = bpe.decode(encoded);

      expect(decoded).toBe('a');
    });

    test('should handle unknown characters', () => {
      const bpe = new NaiveBPE(50);
      bpe.train('abc');

      // 'x' was not in training corpus
      const encoded = bpe.encode('x');
      expect(encoded).toBeInstanceOf(Array);
    });

    test('should stop training when vocab size reached', () => {
      const vocabSize = 30;
      const bpe = new NaiveBPE(vocabSize);
      bpe.train('aaaaaaaaaa bbbbbbbbbb cccccccccc');

      expect(bpe.getVocabSize()).toBeLessThanOrEqual(vocabSize);
    });
  });

  describe('integration', () => {
    test('should work with realistic text', () => {
      const bpe = new NaiveBPE(200);
      const corpus = `
        The quick brown fox jumps over the lazy dog.
        The lazy dog sleeps while the fox runs.
        A quick fox is faster than a lazy dog.
      `.trim();

      bpe.train(corpus);

      const testText = 'the quick fox';
      const encoded = bpe.encode(testText);
      const decoded = bpe.decode(encoded);

      expect(decoded).toBe(testText);
      // Encoding should compress the text
      expect(encoded.length).toBeLessThanOrEqual(testText.length);
    });
  });
});

describe('GPT2BPE', () => {
  let bpe: GPT2BPE;

  beforeAll(async () => {
    bpe = new GPT2BPE();
    await bpe.loadModelFromFiles(GPT2_ENCODER_PATH, GPT2_VOCAB_PATH);
  });

  test('should load GPT-2 model', () => {
    // GPT-2 has 50257 tokens
    expect(bpe.getVocabSize()).toBe(50257);
  });

  test('should encode simple text', () => {
    const encoded = bpe.encode('Hello, world!');
    expect(encoded).toBeInstanceOf(Array);
    expect(encoded.length).toBeGreaterThan(0);
  });

  test('should decode encoded text back to original', () => {
    const text = 'Hello, world!';
    const encoded = bpe.encode(text);
    const decoded = bpe.decode(encoded);
    expect(decoded).toBe(text);
  });

  test('should handle spaces with GPT-2 encoding', () => {
    const text = 'hello world';
    const encoded = bpe.encode(text);
    const decoded = bpe.decode(encoded);
    expect(decoded).toBe(text);
  });

  test('should handle newlines', () => {
    const text = 'hello\nworld';
    const encoded = bpe.encode(text);
    const decoded = bpe.decode(encoded);
    expect(decoded).toBe(text);
  });

  test('should handle special tokens with allowed set', () => {
    const text = 'Hello<|endoftext|>World';
    const encoded = bpe.encode(text, new Set(['<|endoftext|>']));
    const decoded = bpe.decode(encoded);
    expect(decoded).toBe(text);
  });

  test('should compress common words', () => {
    const text = 'the quick brown fox';
    const encoded = bpe.encode(text);
    // GPT-2 should compress this to fewer tokens than characters
    expect(encoded.length).toBeLessThan(text.length);
  });

  test('should handle multiple spaces', () => {
    const text = 'hello   world';
    const encoded = bpe.encode(text);
    const decoded = bpe.decode(encoded);
    expect(decoded).toBe(text);
  });

  test('should handle carriage return', () => {
    const text = 'hello\r\nworld';
    const encoded = bpe.encode(text);
    const decoded = bpe.decode(encoded);
    expect(decoded).toBe(text);
  });

  test('should handle unicode', () => {
    const text = '你好世界 🌍';
    const encoded = bpe.encode(text);
    const decoded = bpe.decode(encoded);
    expect(decoded).toBe(text);
  });

  test('should handle empty string', () => {
    const encoded = bpe.encode('');
    expect(encoded).toEqual([]);
  });

  test('should decode empty array', () => {
    const decoded = bpe.decode([]);
    expect(decoded).toBe('');
  });
});
