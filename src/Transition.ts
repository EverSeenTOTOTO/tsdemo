import { Input, State, StateSet } from './FiniteStateMachine';
import { CFGInput, ContextFreeGrammar } from './ContextFreeGrammar';
import { PushdownAutomaton, PDATransform, PDATransformTable } from './PushdownAutomata';

import { ExtendSet } from './utils';

export const CFG2PDA = (cfg: ContextFreeGrammar) => {
  const start = new State('START');
  const loop = new State('LOOP');
  const accept = new State('ACCEPT');
  const transforms = new PDATransformTable([
    [
      loop,
      new PDATransform([
        [CFGInput.EPSILON, new ExtendSet([[accept, Input.$, CFGInput.EPSILON]])], // LOOP + ε,$->ε = ACCEPT
      ]),
    ],
  ]);

  // 当前状态为q，栈顶为top，转到next，并将str全部压入栈（top->str）
  // 中途会添加多个辅助状态，str除最后一个字符外的每个字符对应一个辅助状态
  // q + ε,top->str[0] = TEMP0
  // TEMP0 + ε,ε->str[1] = TEMP1
  // ...
  // TEMPn-1 + ε,ε->s[n] = next
  let id = 0;
  const addTransform = (q: State, top: Input, next: State, str: Input[]) => {
    const rev = str.reverse();

    let lastState = q;
    for (let i = 0; i < str.length; ++i) {
      const transform = transforms.get(lastState) ?? new PDATransform();
      const newState = i === str.length - 1 ? next : new State(`TEMP${id++}`);
      const ruleSet = transform.get(CFGInput.EPSILON) ?? new ExtendSet();
      const replace = i === 0 ? top : CFGInput.EPSILON;

      ruleSet.add([newState, replace, rev[i]]);
      transform.set(CFGInput.EPSILON, ruleSet);
      transforms.set(lastState, transform);
      lastState = newState;
    }
  };

  // 添加CFG的起始变元
  // START + ε,ε->S$ = LOOP
  // 实际要添加的是START + ε,ε->$ => TEMP0, TEMP0 + ε,ε->S = LOOP
  addTransform(start, CFGInput.EPSILON, loop, [cfg.start, CFGInput.$]);

  const pda = new PushdownAutomaton(
    cfg.name,
    transforms,
    start,
    new StateSet([accept]),
  );

  // 对于栈顶的非终结符S，非确定性地选择一个关于S的规则，并且把S替换成该规则右部的字符串
  // 以S -> aTb | b为例，先选规则aTb，要把栈顶的S换成aTb，体现在转换表中就是
  // LOOP + ε,S->b = TEMP1，注意匹配时是从aTb，所以b先入栈，T、a后入栈
  // TEMP1 + ε,ε->T = TEMP2
  // TEMP2 + ε,ε->a = LOOP
  // 随后选择规则b，体现在转换表中
  // LOOP + ε,S->b = LOOP
  for (const [nt, d] of cfg.derivations) {
    for (const rule of d) {
      // addTransform(loop, S, loop, aTb)
      addTransform(loop, nt, loop, rule);
    }
  }

  // 对于非终结符，都是选择一个规则，并且把非终结符替换成规则右部的字符串入栈，表示S->Rule的推导过程。这一过程不读输入串
  // 当栈顶是终结符时，才真正读取输入串并匹配，比如对于终结符b
  // LOOP + b,b->ε = LOOP，匹配成功，把b出栈
  for (const t of cfg.Terms) {
    const transform = transforms.get(loop) ?? new PDATransform();
    const ruleSet = transform.get(t) ?? new ExtendSet();

    ruleSet.add([loop, t, CFGInput.EPSILON]);
    transform.set(t, ruleSet);
    transforms.set(loop, transform);
  }

  return pda;
};
