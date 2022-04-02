/* eslint-disable max-classes-per-file */
import Table from 'cli-table';
import { Input } from './FiniteStateMachine';
import {
  flattern,
  ExtendMap,
  ExtendSet,
  ExtendArray,
} from './utils';

export class CFGInput extends Input {
  // 是否是终结符
  term?: boolean;

  constructor(name: string, nonTerm?: boolean) {
    super(name);
    this.term = nonTerm;
  }
}

export class CFGRule<T extends CFGInput = CFGInput> extends ExtendArray<T> {
  static isEpsilonRule<P extends CFGInput = CFGInput>(rule: CFGRule<P>): boolean {
    return rule.length === 1 && rule[0] === CFGInput.EPSILON;
  }
}
export class CFGRuleSet<T extends CFGInput = CFGInput> extends ExtendSet<CFGRule<T>> {}
export class CFGDerivations<T extends CFGInput = CFGInput> extends ExtendMap<T, CFGRuleSet<T>> {}

export class ContextFreeGrammar<T extends CFGInput = CFGInput> {
  name: string;

  derivations: CFGDerivations<T>;

  start: T;

  constructor(name: string, derivings: CFGDerivations<T>, start: T) {
    this.name = name;
    this.derivations = derivings;
    this.start = start;
  }

  get NonTerms() {
    return new ExtendSet<T>(
      [
        ...this.derivations.ks(),
        ...flattern(this.derivations.ks().map((nt) => {
          return this.derivations.get(nt)!.vs().map((arr) => {
            return arr.filter((expr) => expr !== CFGInput.EPSILON && !expr.term);
          });
        })),
      ]
        .sort((a, b) => {
          if (this.start === a) {
            return -1;
          }
          if (this.start === b) {
            return 1;
          }
          return a.name > b.name ? 1 : 0;
        }),
    );
  }

  get Terms() {
    return new ExtendSet<T>(
      flattern(this.derivations.ks().map((nt) => {
        return this.derivations.get(nt)!.vs().map((arr) => {
          return arr.filter((expr) => expr !== CFGInput.EPSILON && expr.term);
        });
      }))
        .sort((a, b) => (a.name < b.name ? -1 : 0)),
    );
  }

  toString() {
    const derivings = this.derivations.ks().map((k) => {
      const v = this.derivations.get(k)!;
      return `${k.name} -> ${v.vs().map((arr) => {
        return arr.map((expr) => expr.name).join('');
      }).join(' | ')}`;
    });
    const table = new Table({
      rows: [
        ['CFG', this.name],
        ['NonTerms', this.NonTerms.vs().map((nt) => nt.name).join(', ')],
        ['Terms', this.Terms.vs().map((t) => t.name).join(', ')],
        ['Start', this.start.name],
        ['Derivation', derivings.join('\n')],
      ],
    });

    return table.toString();
  }
}

// export const toChomskyNormalForm = <T extends CFGExpr = CFGExpr> (cfg: ContextFreeGrammar<T>) => {
//   let id = 0; // 防止中途新增的变元出现重复命名
//   const S0 = new CFGExpr(`${cfg.start.name}${id++}`, false); // 新增起始变元S0，S0 -> S，使得起始变元不会出现在右侧
//   cfg.derivations.set(S0 as T, new CFGRuleSet([[cfg.start]]));
//
//   // 记录已删除的规则，防止中途添加已经删除过的规则
//   const deletedRules = new CFGDerivations();
//   const isDeleted = (nt: T, rule: CFGRule<T>) => {
//     if (deletedRules.has(nt)) {
//       const deleted = deletedRules.get(nt)!;
//       return deleted.vs().filter((d) => ExtendArray.isSame(rule, d)).length > 0;
//     }
//     return false;
//   };
//
//   const derivations = new CFGDerivations();
//
//   // 处理形如 A->ε 的规则，若有R->uAvAw，需添加R->uvAw|uAvw|uvw；若有R->A，需添加R->ε，除非之前已经删除过R->ε
//   const deleteEpsilonRules = () => {
//
//   };
//
//   // 处理形如 A->B 的规则，若有B->X，需添加A->X，除非之前已经删除过A->X
//   const deleteSingleNonTermRules = () => {
//
//   };
//
//   // 处理形如 A->ABC 的规则，添加A->AA1，A1->BC
//   const replaceMultiNonTermRules = () => {
//
//   };
//
//   // 处理形如 A->aB 的规则，添加A->UB, U->a
//   const replaceTermAheadRules = () => {
//
//   };
//
//   deleteEpsilonRules();
//   deleteSingleNonTermRules();
//   replaceMultiNonTermRules();
//   replaceTermAheadRules();
//
//   return new ContextFreeGrammar(
//     `CNF(${cfg.name})`,
//     derivations,
//     S0,
//   );
// };
