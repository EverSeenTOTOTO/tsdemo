/* eslint-disable no-await-in-loop */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import EventEmitter from 'events';
//
// type PushEvent<S, T> = {
//   slot: S,
//   value: T
// };
// type PullEvent<S> = {
//   slot: S,
// };
// type ConnectInfo<S, O> = {
//   node: Node<S, O, any>;
//   slot: S
// };
//
// class Node<S, I, O> extends EventEmitter {
//   slots: Map<S, ConnectInfo<any, O>[]>;
//
//   name: string;
//
//   cache?: O;
//
//   onPush: (e: PushEvent<S, I>) => void;
//
//   onPull: ((e: PullEvent<S>) => O | undefined) | undefined;
//
//   constructor(name: string, onPush: (self: Node<S, I, O>, e: PushEvent<S, I>) => void, onPull?: (self: Node<S, I, O>, e: PullEvent<S>) => O|undefined) {
//     super();
//
//     this.name = name;
//     this.slots = new Map();
//     this.onPush = onPush.bind(null, this);
//     this.onPull = onPull?.bind(null, this);
//   }
//
//   push(slot: S, value: I) {
//     this.onPush({ slot, value });
//   }
//
//   pull(slot: S) {
//     return this.onPull?.({ slot }) ?? this.cache;
//   }
//
//   set(value?: O) {
//     this.cache = value;
//   }
//
//   connect(slot: S, info: ConnectInfo<any, O>) {
//     const nodes = this.slots.get(slot) ?? [];
//
//     nodes.push(info);
//     this.slots.set(slot, nodes);
//   }
// }
//
// const makeLog = (name: string) => {
//   return new Node<'log', any, any>(name, (_self, e) => {
//     console.log(`${name}: ${e.value} -> ${e.slot}`);
//   });
// };
//
// const makeConst = (x: number) => {
//   const node = new Node<'value', any, any>(String(x), () => { throw new Error('Push to constant'); });
//
//   node.set(x);
//
//   return node;
// };
//
// const makeInterface = (name: string) => {
//   return new Node<'value', number, number>(
//     name,
//     (self, e) => {
//       if (self.cache !== e.value) {
//         self.set(e.value);
//         self.slots.get('value')?.forEach((n) => n.node.push(n.slot, e.value));
//       }
//     },
//   );
// };
//
// const makePipe = <I, O>(foo: (x: I) => O) => {
//   return new Node<'input'|'output', I, O>(
//     'pipe',
//     (self, e) => {
//       if (e.slot !== 'input') throw new Error('Wrong push slot');
//       const result = foo(e.value);
//       self.slots.get('output')?.forEach((n) => n.node.push(n.slot, result));
//     },
//     (self, e) => {
//       if (e.slot !== 'output') throw new Error('Wrong pull slot');
//       const input = self.slots.get('input')?.[0];
//       const value = input?.node.pull(input?.slot);
//
//       return value ? foo(value) : undefined;
//     },
//   );
// };
//
// const makeAdd = (name: string) => {
//   // a + b = r
//   return new Node<'a'|'b'|'r', number, number>(
//     name,
//     (self, e) => {
//       switch (e.slot) {
//         case 'a':
//         case 'b': {
//           const r = self.slots.get('r')?.[0];
//           const rvalue = r?.node.pull(r.slot);
//           const another = self.slots.get(e.slot === 'a' ? 'b' : 'a')?.[0];
//           const anotherValue = another?.node.pull(another?.slot);
//
//           if (!rvalue && anotherValue) {
//             const result = anotherValue + e.value;
//
//             r?.node.push(r?.slot, result);
//           } else if (rvalue && !anotherValue) {
//             another?.node.push(another?.slot, rvalue - e.value);
//           }
//           break;
//         }
//         case 'r': {
//           const a = self.slots.get('a')?.[0];
//           const b = self.slots.get('b')?.[0];
//           const avalue = a?.node.pull(a?.slot);
//           const bvalue = b?.node.pull(b?.slot);
//
//           if (avalue && !bvalue) {
//             b?.node.push(b.slot, e.value - avalue);
//           } else if (bvalue && !avalue) {
//             a?.node.push(a.slot, e.value - bvalue);
//           }
//
//           break;
//         }
//         default:
//           throw new Error(`Push to unknown slot: ${e.slot}`);
//       }
//     },
//     (self, e) => {
//       switch (e.slot) {
//         case 'a':
//         case 'b': {
//           const another = self.slots.get(e.slot)?.[0];
//           const anotherValue = another?.node.pull(another?.slot);
//           const r = self.slots.get('r')?.[0];
//           const rvalue = r?.node.pull(r.slot);
//
//           if (anotherValue && rvalue) {
//             return rvalue - anotherValue;
//           }
//           return undefined;
//         }
//         case 'r': {
//           const a = self.slots.get('a')?.[0];
//           const b = self.slots.get('b')?.[0];
//           const avalue = a?.node.pull(a?.slot);
//           const bvalue = b?.node.pull(b?.slot);
//
//           if (avalue && bvalue) {
//             return avalue + bvalue;
//           }
//           return undefined;
//         }
//         default:
//           throw new Error(`Pull from unknown slot: ${e.slot}`);
//       }
//     },
//   );
// };
//
// const connect = <S1, S2, I, O>(a: Node<S1, I, O>, slota: S1, b: Node<S2, O, I>, slotb: S2) => {
//   a.connect(slota, {
//     slot: slotb,
//     node: b,
//   });
//   b.connect(slotb, {
//     slot: slota,
//     node: a,
//   });
// };
//
// (function main() {
//   const one = makeConst(1);
//   const two = makeConst(2);
//   const x = makeInterface('x');
//   const y = makeInterface('y');
//   const z = makeInterface('z');
//   const addx = makeAdd('addx');
//   const addy = makeAdd('addy');
//   const addn = makeAdd('addn');
//   const pipe = makePipe((t: number) => t * 2);
//
//   connect(x, 'value', makeLog('x'), 'log');
//   connect(y, 'value', makeLog('y'), 'log');
//   connect(z, 'value', pipe, 'input');
//   connect(pipe, 'output', makeLog('2z'), 'log');
//
//   // y + (1 + 2) = x + z
//   connect(addx, 'a', x, 'value');
//   connect(addx, 'b', z, 'value');
//   connect(addn, 'a', one, 'value');
//   connect(addn, 'b', two, 'value');
//   connect(addy, 'a', y, 'value');
//   connect(addy, 'b', addn, 'r');
//   connect(addy, 'r', addx, 'r');
//
//   const debug = () => console.log([x.cache, y.cache, z.cache]);
//
//   y.push('value', 2);
//   debug();
//   x.push('value', 8);
//   debug();
//   z.set();
//   debug();
//   y.set();
//   debug();
//   x.push('value', 1);
//   debug();
//   z.push('value', 5);
//   debug();
// }());

// Ideas:
// 1. 环路、积分器
// 2. 每个node都有一个EventEmitter、Map太浪费了，总线、容器
// 3. decorator 辅助书写结点
// 4. 清理图中的状态
// 6. 一个全局的状态，提供一个栈进行步进，一个栈树实现undo tree
// 7. 全局状态使用diff进行回退，局部状态自行提供回退策略
// 8. 全局状态+结点构成process

// const call = <A, R>(f: R|((a?: A) => R)|((a?: A) => Promise<R>)) => (a?: A) => {
//   if (typeof f === 'function') {
//     if (toString.call(f) === '[object AsyncFunction]') {
//       return (f as (a?: A) => Promise<R>)(a);
//     }
//     return Promise.resolve((f as (a?: A) => R)(a));
//   }
//   return Promise.resolve(f);
// };
//
// type Fiber = any;
//
// class Stack<T> {
//   stack: T[] = [];
//
//   push(x: T) {
//     return this.stack.push(x);
//   }
//
//   pop() {
//     return this.stack.pop();
//   }
//
//   top() {
//     return this.stack[this.stack.length - 1];
//   }
//
//   clear() {
//     this.stack = [];
//   }
// }
//
// class Process {
//   current: Stack<Fiber> = new Stack();
//
//   pending: Stack<Fiber> = new Stack();
//
//   undos: Stack<Fiber> = new Stack();
//
//   async step() {
//     // swap
//     const temp = this.current;
//     this.current = this.pending;
//     this.pending = temp;
//
//     const undos = new Stack<Fiber>();
//     const tops = new Stack<Fiber>();
//
//     while (this.current.top()) {
//       const top = this.current.pop();
//       const { next, undo } = await call(top)();
//
//       tops.push(top);
//       if (next) this.pending.push(next);
//       if (undo) undos.push(undo);
//     }
//
//     this.undos.push(async () => {
//       this.pending.clear();
//       while (tops.top()) {
//         this.pending.push(tops.pop());
//       }
//
//       while (undos.top()) {
//         await call(undos.pop())?.();
//       }
//     });
//   }
//
//   back() {
//     return call(this.undos.pop())();
//   }
//
//   start(fiber: Fiber) {
//     this.pending.push(fiber);
//   }
// }
//
// (async function main() {
//   const p = new Process();
//
//   let i = 0;
//
//   p.start(async function loop() {
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     console.log(i++);
//     return {
//       next: loop,
//       undo() {
//         i--;
//       },
//     };
//   });
//
//   await p.step();
//   await p.step();
//   await p.back();
//   await p.step();
//   await p.step();
//   await p.step();
//   await p.back();
//   await p.step();
// }());

(async function main() {
  const foo = (x, callback) => {
    if (x.length === 0) return callback([], []);

    return foo(x.slice(1), (arr, a2) => {
      let next = x[0];
      return callback([++next, ...arr], [arr, ...a2]);
    });
  };

  const x = [1, 2, 3];
  const r = foo(x, (arr, a2) => {
    console.log(a2);
    return arr;
  });

  console.log(x);
  console.log(r);
}());
