/**
 * Byte Pair Encoding (BPE) 实现
 *
 * BPE 是一种子词分词算法，通过迭代合并最高频率的相邻字节对来构建词汇表。
 * 广泛用于 GPT、BERT 等现代 LLM 的 tokenizer。
 *
 * 支持两种模式：
 * 1. 从零训练：train() + encode()/decode() - 简单字符级 BPE
 * 2. GPT-2 预训练模型：loadGPT2Model() + encode()/decode() - 兼容 GPT-2 tokenizer
 */

/** GPT-2 特殊字符 */
const GPT2_SPACE = 'Ġ'; // U+0120, 表示空格前缀
const GPT2_NEWLINE = 'Ċ'; // U+010A, 表示换行

/** 默认特殊 token */
const DEFAULT_SPECIAL_TOKENS = ['<|endoftext|>'] as const;

/**
 * 统计相邻 token 对的频率 (字符串模式)
 */
function getStringPairCounts(tokens: string[]): Map<string, number> {
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
 * Byte Pair Encoder 类
 */
export class BytePairEncoder {
  /** token string -> token id */
  private vocab: Map<string, number> = new Map();
  /** token id -> token string */
  private inverseVocab: Map<number, string> = new Map();
  /** BPE merges: "token1 token2" (训练模式) */
  private merges: string[] = [];
  /** GPT-2 rank-based merges: "token1 token2" -> rank */
  private bpeRanks: Map<string, number> = new Map();
  /** 目标词汇表大小 */
  private vocabSize: number;
  /** 是否已加载 GPT-2 模型 */
  private isGPT2Mode: boolean = false;
  /** 特殊 token 集合 */
  private specialTokens: Set<string> = new Set();

  constructor(vocabSize: number = 256) {
    this.vocabSize = vocabSize;
  }

  /**
   * 预处理文本：GPT-2 风格的空格和换行处理 (仅 GPT-2 模式)
   */
  private preprocessTextGPT2(text: string): string[] {
    const tokens: string[] = [];
    let pendingSpaces = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '\n') {
        for (let j = 0; j < pendingSpaces; j++) {
          tokens.push(GPT2_SPACE);
        }
        pendingSpaces = 0;
        tokens.push(GPT2_NEWLINE);
      } else if (char === '\r') {
        for (let j = 0; j < pendingSpaces; j++) {
          tokens.push(GPT2_SPACE);
        }
        pendingSpaces = 0;
        // GPT-2 uses id 201 for carriage return
        tokens.push('\r');
      } else if (char === ' ') {
        pendingSpaces++;
      } else {
        if (pendingSpaces > 0) {
          // 第一个空格与后续字符合并
          tokens.push(GPT2_SPACE + char);
          for (let j = 1; j < pendingSpaces; j++) {
            tokens.push(GPT2_SPACE);
          }
          pendingSpaces = 0;
        } else {
          tokens.push(char);
        }
      }
    }

    // 末尾空格
    for (let j = 0; j < pendingSpaces; j++) {
      tokens.push(GPT2_SPACE);
    }

    return tokens;
  }

  /**
   * 训练 BPE 模型 (简单模式)
   * @param corpus 训练语料
   */
  train(corpus: string): void {
    this.isGPT2Mode = false;
    this.bpeRanks.clear();
    this.specialTokens.clear();

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
    while (this.vocab.size < this.vocabSize) {
      const counts = getStringPairCounts(tokens);
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
   * 简单编码 (训练模式)
   */
  private encodeSimple(text: string): number[] {
    let tokens = text.split('');

    // 按训练顺序应用合并规则
    for (const pair of this.merges) {
      tokens = mergePairTokens(tokens, pair);
    }

    // 将 tokens 转换为 ID
    return tokens.map(token => {
      const id = this.vocab.get(token);
      if (id === undefined) {
        // 未知 token 返回 0 (与原始行为一致)
        return 0;
      }
      return id;
    });
  }

  /**
   * 使用 GPT-2 rank 进行编码
   */
  private encodeWithRanks(token: string): number[] {
    let symbols = token.split('');

    // 检查所有字符都在词汇表中
    for (const sym of symbols) {
      if (!this.vocab.has(sym)) {
        throw new Error(`Character not in vocab: "${sym}"`);
      }
    }

    // 使用 rank 进行合并
    while (symbols.length > 1) {
      // 收集所有相邻 pair
      const pairs: [string, string][] = [];
      for (let i = 0; i < symbols.length - 1; i++) {
        pairs.push([symbols[i], symbols[i + 1]]);
      }

      if (pairs.length === 0) break;

      // 找到 rank 最小的 pair
      let minRank = Infinity;
      let bestPair: [string, string] | null = null;

      for (const p of pairs) {
        const key = `${p[0]} ${p[1]}`;
        const rank = this.bpeRanks.get(key);
        if (rank !== undefined && rank < minRank) {
          minRank = rank;
          bestPair = p;
        }
      }

      if (bestPair === null) break;

      // 合并所有出现的 pair
      const [first, second] = bestPair;
      const newSymbols: string[] = [];
      let i = 0;
      while (i < symbols.length) {
        if (
          i < symbols.length - 1 &&
          symbols[i] === first &&
          symbols[i + 1] === second
        ) {
          newSymbols.push(first + second);
          i += 2;
        } else {
          newSymbols.push(symbols[i]);
          i += 1;
        }
      }
      symbols = newSymbols;
    }

    return symbols.map(sym => {
      const id = this.vocab.get(sym);
      if (id === undefined) {
        throw new Error(`Token not in vocab: "${sym}"`);
      }
      return id;
    });
  }

  /**
   * GPT-2 风格编码
   */
  private encodeGPT2(text: string, allowedSpecial?: Set<string>): number[] {
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
            tokenIds.push(...this.encodeGPT2Chunk(prefix));
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
      tokenIds.push(...this.encodeGPT2Chunk(text));
    }

    return tokenIds;
  }

  /**
   * 编码 GPT-2 文本块
   */
  private encodeGPT2Chunk(text: string): number[] {
    const tokenIds: number[] = [];
    const tokens = this.preprocessTextGPT2(text);

    for (const tok of tokens) {
      const id = this.vocab.get(tok);
      if (id !== undefined) {
        tokenIds.push(id);
      } else {
        tokenIds.push(...this.encodeWithRanks(tok));
      }
    }

    return tokenIds;
  }

  /**
   * 编码文本
   */
  encode(text: string, allowedSpecial?: Set<string>): number[] {
    if (this.isGPT2Mode) {
      return this.encodeGPT2(text, allowedSpecial);
    }
    return this.encodeSimple(text);
  }

  /**
   * 解码 token IDs
   */
  decode(ids: number[]): string {
    const parts: string[] = [];

    for (const id of ids) {
      const token = this.inverseVocab.get(id);
      if (token === undefined) {
        throw new Error(`Token ID ${id} not found in vocab`);
      }

      // GPT-2 特殊字符处理
      if (this.isGPT2Mode) {
        if (token === GPT2_NEWLINE) {
          parts.push('\n');
          continue;
        }
        if (token === '\r') {
          parts.push('\r');
          continue;
        }
        if (token.startsWith(GPT2_SPACE)) {
          parts.push(' ' + token.slice(1));
          continue;
        }
      }

      parts.push(token);
    }

    return parts.join('');
  }

  /**
   * 加载 GPT-2 预训练模型
   */
  loadGPT2Model(encoderJson: Record<string, number>, vocabBpe: string): void {
    this.isGPT2Mode = true;
    this.vocab.clear();
    this.inverseVocab.clear();
    this.bpeRanks.clear();
    this.merges = [];

    // 加载 vocabulary (encoder.json 格式: token -> id)
    for (const [token, id] of Object.entries(encoderJson)) {
      this.vocab.set(token, id);
      this.inverseVocab.set(id, token);
    }

    // 添加换行符别名 (GPT-2: Ċ at id 198)
    if (this.vocab.has(GPT2_NEWLINE)) {
      this.vocab.set('\n', this.vocab.get(GPT2_NEWLINE)!);
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

    this.vocabSize = this.vocab.size;
  }

  /**
   * 从本地文件加载 GPT-2 模型 (Node.js 环境)
   */
  async loadGPT2ModelFromFiles(
    encoderPath: string,
    vocabPath: string,
  ): Promise<void> {
    const fs = await import('fs/promises');
    const [encoderContent, vocabContent] = await Promise.all([
      fs.readFile(encoderPath, 'utf-8'),
      fs.readFile(vocabPath, 'utf-8'),
    ]);

    const encoderJson = JSON.parse(encoderContent);
    this.loadGPT2Model(encoderJson, vocabContent);
  }

  /**
   * 获取词汇表
   */
  getVocab(): Map<string, number> {
    return new Map(this.vocab);
  }

  /**
   * 获取合并规则 (训练模式)
   */
  getMerges(): string[] {
    return [...this.merges];
  }

  /**
   * 获取 BPE ranks (GPT-2 模式)
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

  /**
   * 是否为 GPT-2 模式
   */
  isGPT2(): boolean {
    return this.isGPT2Mode;
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
    this.vocabSize = this.vocab.size;
    this.isGPT2Mode = false;
  }
}

export default BytePairEncoder;
