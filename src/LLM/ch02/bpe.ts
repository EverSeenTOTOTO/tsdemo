/**
 * Byte Pair Encoding (BPE) 实现
 *
 * BPE 是一种子词分词算法，通过迭代合并最高频率的相邻字节对来构建词汇表。
 * 广泛用于 GPT、BERT 等现代 LLM 的 tokenizer。
 *
 * 核心概念：
 *
 * 【Token 的界定】
 * - 初始状态：每个字符是一个独立 token (corpus.split(''))
 * - 训练过程：高频相邻 token 被合并，形成更大的 token
 * - 最终状态：token 可以是单字符、字符组合、子词或完整词
 *
 *   示例演进过程：
 *   初始: ['h','e','l','l','o']
 *     → 合并 'l'+'l' → ['h','e','ll','o']
 *     → 合并 'h'+'e' → ['he','ll','o']
 *     → 合并 'he'+'ll' → ['hell','o']
 *
 * 【Pair 与 Token 的关系】
 * - Pair = 两个相邻的 token（临时概念，用于驱动合并）
 * - 统计所有相邻 pair 的频率，选择最高频 pair 合并为新 token
 *
 *   示例：
 *   语料 "hello hello" → tokens: ['h','e','l','l','o',' ','h','e','l','l','o']
 *   统计 pairs: {'h e':2, 'e l':2, 'l l':2, 'l o':2, ...}
 *   最高频 pair 'l l' → 合并成新 token 'll'
 *
 * 【类结构】
 * - NaiveBPE: 从零训练的简单实现，适合学习和理解算法原理
 * - GPT2BPE: 兼容 GPT-2 预训练模型，处理空格和换行有特殊逻辑
 */

/**
 * 统计相邻 token 对的频率 (字符串模式)
 */
function getPairCounts(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const pair = `${tokens[i]} ${tokens[i + 1]}`;
    counts.set(pair, (counts.get(pair) || 0) + 1);
  }
  return counts;
}

/**
 * 获取出现次数最多的 token 对
 */
function getMostFrequentPair(counts: Map<string, number>): string | null {
  let maxCount = 0;
  let bestPair: string | null = null;

  for (const [pair, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      bestPair = pair;
    }
  }

  return bestPair;
}

/**
 * 合并指定的字符串 token 对
 */
function mergePairTokens(tokens: string[], pair: string): string[] {
  const [first, second] = pair.split(' ');
  const newToken = first + second;
  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    if (
      i < tokens.length - 1 &&
      tokens[i] === first &&
      tokens[i + 1] === second
    ) {
      result.push(newToken);
      i += 2;
    } else {
      result.push(tokens[i]);
      i += 1;
    }
  }

  return result;
}

/**
 * 简单 BPE 实现：从零训练
 *
 * 适用场景：学习算法原理、小规模语料实验
 */
export class NaiveBPE {
  /** token string -> token id */
  protected vocab: Map<string, number> = new Map();
  /** token id -> token string */
  protected inverseVocab: Map<number, string> = new Map();
  /** BPE merges: "token1 token2" 按训练顺序排列 */
  protected merges: string[] = [];
  /** 目标词汇表大小 */
  protected targetVocabSize: number;

  constructor(vocabSize: number = 256) {
    this.targetVocabSize = vocabSize;
  }

  /**
   * 训练 BPE 模型
   * @param corpus 训练语料
   */
  train(corpus: string): void {
    // 初始化：将每个字符作为一个 token
    const tokens = corpus.split('');

    // 初始化词汇表：所有唯一字符
    const uniqueChars = [...new Set(tokens)];
    this.vocab = new Map();
    this.inverseVocab = new Map();

    for (let i = 0; i < uniqueChars.length; i++) {
      this.vocab.set(uniqueChars[i], i);
      this.inverseVocab.set(i, uniqueChars[i]);
    }

    this.merges = [];

    // 迭代合并，直到达到目标词汇表大小
    while (this.vocab.size < this.targetVocabSize) {
      const counts = getPairCounts(tokens);
      const bestPair = getMostFrequentPair(counts);

      if (!bestPair) break;

      const mergedToken = bestPair.split(' ').join('');

      // 记录合并前的 vocab 大小
      const prevVocabSize = this.vocab.size;

      // 添加到词汇表和合并规则
      const newId = this.vocab.size;
      this.vocab.set(mergedToken, newId);
      this.inverseVocab.set(newId, mergedToken);
      this.merges.push(bestPair);

      // 应用合并
      const newTokens = mergePairTokens(tokens, bestPair);
      tokens.length = 0;
      tokens.push(...newTokens);

      // 如果 vocab 没有增长（mergedToken 已存在），退出循环
      if (this.vocab.size === prevVocabSize) break;
    }
  }

  /**
   * 编码文本为 token IDs
   */
  encode(text: string): number[] {
    if (text.length === 0) return [];

    let tokens = text.split('');

    // 按训练顺序应用合并规则
    for (const pair of this.merges) {
      tokens = mergePairTokens(tokens, pair);
    }

    // 将 tokens 转换为 ID
    return tokens.map(token => {
      const id = this.vocab.get(token);
      // 未知 token 返回 0
      return id ?? 0;
    });
  }

  /**
   * 解码 token IDs 为文本
   */
  decode(ids: number[]): string {
    return ids
      .map(id => {
        const token = this.inverseVocab.get(id);
        if (token === undefined) {
          throw new Error(`Token ID ${id} not found in vocab`);
        }
        return token;
      })
      .join('');
  }

  /**
   * 获取词汇表
   */
  getVocab(): Map<string, number> {
    return new Map(this.vocab);
  }

  /**
   * 获取合并规则
   */
  getMerges(): string[] {
    return [...this.merges];
  }

  /**
   * 获取词汇表大小
   */
  getVocabSize(): number {
    return this.vocab.size;
  }

  /**
   * 导出模型
   */
  export(): { vocab: [string, number][]; merges: string[] } {
    return {
      vocab: [...this.vocab.entries()],
      merges: this.merges,
    };
  }

  /**
   * 导入模型
   */
  import(model: { vocab: [string, number][]; merges: string[] }): void {
    this.vocab = new Map(model.vocab);
    this.inverseVocab = new Map();
    for (const [token, id] of model.vocab) {
      this.inverseVocab.set(id, token);
    }
    this.merges = model.merges;
    this.targetVocabSize = this.vocab.size;
  }
}

/** GPT-2 特殊字符 */
const GPT2_SPACE = 'Ġ'; // U+0120, 表示空格前缀
const GPT2_NEWLINE = 'Ċ'; // U+010A, 表示换行
const GPT2_CR = 'č'; // U+010D, 表示回车符 (GPT-2 bytes_to_unicode 映射)

/** 默认特殊 token */
const DEFAULT_SPECIAL_TOKENS = ['<|endoftext|>'] as const;

/**
 * GPT-2 字节到 Unicode 的映射
 *
 * GPT-2 将所有 256 个字节映射到可打印 Unicode 字符
 * 这样可以确保 token 文件是干净的 UTF-8 文本
 */
function buildBytesToUnicode(): Map<number, string> {
  // 可打印字节范围
  const printableBytes: number[] = [];

  // ASCII 可打印字符: 33-126 (! ~)
  for (let i = 33; i <= 126; i++) printableBytes.push(i);
  // Latin-1 补充: 161-172 (¡ ¬)
  for (let i = 161; i <= 172; i++) printableBytes.push(i);
  // Latin-1 补充: 174-255 (® ÿ)
  for (let i = 174; i <= 255; i++) printableBytes.push(i);

  const byteToUnicode = new Map<number, string>();
  let unicodeOffset = 256;

  for (let byte = 0; byte < 256; byte++) {
    if (printableBytes.includes(byte)) {
      byteToUnicode.set(byte, String.fromCharCode(byte));
    } else {
      byteToUnicode.set(byte, String.fromCharCode(unicodeOffset++));
    }
  }

  return byteToUnicode;
}

/**
 * GPT-2 BPE 实现：加载预训练模型
 *
 * 适用场景：兼容 GPT-2 tokenizer，实际生产使用
 *
 * 特殊处理：
 * - 'Ġ' (U+0120): 表示空格前缀，如 "Ġworld" = " world"
 * - 'Ċ' (U+010A): 表示换行符
 * - 'č' (U+010D): 表示回车符
 */
export class GPT2BPE {
  /** token string -> token id */
  protected vocab: Map<string, number> = new Map();
  /** token id -> token string */
  protected inverseVocab: Map<number, string> = new Map();
  /** BPE merges: "token1 token2" -> rank (优先级) */
  protected bpeRanks: Map<string, number> = new Map();
  /** 特殊 token 集合 */
  protected specialTokens: Set<string> = new Set();
  /** 字节到 Unicode 映射 */
  protected byteToUnicode: Map<number, string>;
  /** Unicode 到字节映射 */
  protected unicodeToByte: Map<string, number>;

  constructor() {
    this.byteToUnicode = buildBytesToUnicode();
    this.unicodeToByte = new Map();
    for (const [byte, uni] of this.byteToUnicode) {
      this.unicodeToByte.set(uni, byte);
    }
  }

  /**
   * 加载 GPT-2 预训练模型
   * @param encoderJson encoder.json 内容 (token -> id 映射)
   * @param vocabBpe vocab.bpe 内容 (合并规则，每行 "token1 token2")
   */
  loadModel(encoderJson: Record<string, number>, vocabBpe: string): void {
    this.vocab.clear();
    this.inverseVocab.clear();
    this.bpeRanks.clear();
    this.specialTokens.clear();

    // 加载 vocabulary (encoder.json 格式: token -> id)
    for (const [token, id] of Object.entries(encoderJson)) {
      this.vocab.set(token, id);
      this.inverseVocab.set(id, token);
    }

    // 加载 BPE merges (vocab.bpe 格式: "token1 token2" 每行一个)
    const lines = vocabBpe.split('\n');
    let rank = 0;

    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;

      const parts = line.trim().split(/\s+/);
      if (parts.length !== 2) continue;

      const [token1, token2] = parts;
      if (this.vocab.has(token1) && this.vocab.has(token2)) {
        this.bpeRanks.set(`${token1} ${token2}`, rank++);
      }
    }

    // 设置特殊 token
    this.specialTokens.clear();
    for (const token of DEFAULT_SPECIAL_TOKENS) {
      if (this.vocab.has(token)) {
        this.specialTokens.add(token);
      }
    }
  }

  /**
   * 从本地文件加载 GPT-2 模型 (Node.js 环境)
   */
  async loadModelFromFiles(
    encoderPath: string,
    vocabPath: string,
  ): Promise<void> {
    const fs = await import('fs/promises');
    const [encoderContent, vocabContent] = await Promise.all([
      fs.readFile(encoderPath, 'utf-8'),
      fs.readFile(vocabPath, 'utf-8'),
    ]);

    const encoderJson = JSON.parse(encoderContent);
    this.loadModel(encoderJson, vocabContent);
  }

  /**
   * 将文本编码为 GPT-2 字节序列
   * 空格会转换为 Ġ 前缀，与后面的字符合并
   */
  private textToByteTokens(text: string): string[] {
    const result: string[] = [];
    const bytes = new TextEncoder().encode(text);

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      const char = this.byteToUnicode.get(byte)!;

      // 空格 (byte 32) 映射为 Ġ，并与下一个字符合并
      if (byte === 32 && i + 1 < bytes.length) {
        const nextByte = bytes[i + 1];
        const nextChar = this.byteToUnicode.get(nextByte)!;
        result.push(GPT2_SPACE + nextChar);
        i++; // 跳过下一个字节
      } else {
        result.push(char);
      }
    }

    return result;
  }

  /**
   * 使用 GPT-2 rank 进行 BPE 合并
   */
  private encodeWithRanks(tokens: string[]): number[] {
    // 使用 rank 进行合并
    while (tokens.length > 1) {
      // 找到 rank 最小的 pair
      let minRank = Infinity;
      let bestPair: [string, string] | null = null;

      for (let i = 0; i < tokens.length - 1; i++) {
        const key = `${tokens[i]} ${tokens[i + 1]}`;
        const rank = this.bpeRanks.get(key);
        if (rank !== undefined && rank < minRank) {
          minRank = rank;
          bestPair = [tokens[i], tokens[i + 1]];
        }
      }

      if (bestPair === null) break;

      // 合并所有出现的 pair
      const [first, second] = bestPair;
      const newTokens: string[] = [];
      let i = 0;
      while (i < tokens.length) {
        if (
          i < tokens.length - 1 &&
          tokens[i] === first &&
          tokens[i + 1] === second
        ) {
          newTokens.push(first + second);
          i += 2;
        } else {
          newTokens.push(tokens[i]);
          i += 1;
        }
      }
      tokens = newTokens;
    }

    return tokens.map(tok => {
      const id = this.vocab.get(tok);
      if (id === undefined) {
        throw new Error(`Token not in vocab: "${tok}"`);
      }
      return id;
    });
  }

  /**
   * 编码文本为 token IDs
   * @param text 待编码文本
   * @param allowedSpecial 允许的特殊 token 集合
   */
  encode(text: string, allowedSpecial?: Set<string>): number[] {
    if (!text) return [];

    const tokenIds: number[] = [];

    // 处理特殊 token
    const specials = Array.from(this.specialTokens);
    if (specials.length > 0 && allowedSpecial && allowedSpecial.size > 0) {
      const allowedSpecials = specials.filter(s => allowedSpecial.has(s));
      if (allowedSpecials.length > 0) {
        const specialPattern = allowedSpecials
          .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|');
        const regex = new RegExp(`(${specialPattern})`, 'g');

        let lastIndex = 0;
        let match;
        while ((match = regex.exec(text)) !== null) {
          const prefix = text.slice(lastIndex, match.index);
          if (prefix) {
            tokenIds.push(...this.encodeChunk(prefix));
          }

          const specialToken = match[0];
          const id = this.vocab.get(specialToken);
          if (id !== undefined) {
            tokenIds.push(id);
          }
          lastIndex = match.index + specialToken.length;
        }

        text = text.slice(lastIndex);
      }
    }

    if (text) {
      tokenIds.push(...this.encodeChunk(text));
    }

    return tokenIds;
  }

  /**
   * 编码单个文本块
   */
  private encodeChunk(text: string): number[] {
    // 转换为 GPT-2 字节 token
    const byteTokens = this.textToByteTokens(text);

    const tokenIds: number[] = [];
    for (const tok of byteTokens) {
      const id = this.vocab.get(tok);
      if (id !== undefined) {
        tokenIds.push(id);
      } else {
        // 需要 BPE 合并
        tokenIds.push(...this.encodeWithRanks(tok.split('')));
      }
    }

    return tokenIds;
  }

  /**
   * 解码 token IDs 为文本
   */
  decode(ids: number[]): string {
    const bytes: number[] = [];

    for (const id of ids) {
      const token = this.inverseVocab.get(id);
      if (token === undefined) {
        throw new Error(`Token ID ${id} not found in vocab`);
      }

      // 将 token 的每个 Unicode 字符转换回字节
      for (const char of token) {
        const byte = this.unicodeToByte.get(char);
        if (byte !== undefined) {
          bytes.push(byte);
        }
      }
    }

    return new TextDecoder().decode(Uint8Array.from(bytes));
  }

  /**
   * 获取词汇表
   */
  getVocab(): Map<string, number> {
    return new Map(this.vocab);
  }

  /**
   * 获取 BPE ranks
   */
  getBpeRanks(): Map<string, number> {
    return new Map(this.bpeRanks);
  }

  /**
   * 获取词汇表大小
   */
  getVocabSize(): number {
    return this.vocab.size;
  }
}
