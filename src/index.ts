/* eslint-disable @typescript-eslint/ban-types */
class Expr { }

class Var extends Expr {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  get [Symbol.toStringTag]() {
    return this.name;
  }
}

class Const extends Expr {
  value: string | number;

  constructor(value: string | number) {
    super();
    this.value = value;
  }

  get [Symbol.toStringTag]() {
    return this.value.toString();
  }
}

class Term extends Expr {
  atoms: Expr[];

  constructor(atoms: Expr[]) {
    super();
    this.atoms = atoms;
  }

  get [Symbol.toStringTag]() {
    return this.atoms.map((atom) => atom.toString()).join(', ');
  }
}

const isConstEqual = (c0: Const, c1: Const) => c0.value === c1.value;
const isSameVar = (v0: Var, v1: Var) => v0.name === v1.name;

type Dict = Map<string, Expr>;

const eliminateVariables = (expr: Expr, dict: Dict): Expr => {
  if (expr instanceof Var) {
    return dict.get(expr.name) || expr;
  }

  if (expr instanceof Term) {
    return new Term(expr.atoms.map((atom) => eliminateVariables(atom, dict)));
  }

  return expr;
};

const unify = (pattern1: Expr[], pattern2: Expr[], dict: Dict) => {
  return unifier(
    pattern1,
    pattern2,
    dict,
    () => pattern1.map((expr) => eliminateVariables(expr, dict)),
    (e) => { throw e; },
  );
};

const unifier = (
  pattern1: Expr[],
  pattern2: Expr[],
  dict: Dict,
  onSuccess: () => Expr[] | void,
  onFail: (e: Error) => void,
): Expr[] | void => {
  if (pattern1.length !== pattern2.length) {
    return onFail(new Error(`length not equal:\n\t${pattern1}\n\t${pattern2})}`));
  }

  if (pattern1.length === 0) {
    return onSuccess();
  }

  return dispatch(
    pattern1[0],
    pattern2[0],
    dict,
    () => unifier(
      pattern1.slice(1),
      pattern2.slice(1),
      dict,
      onSuccess,
      onFail,
    ),
    onFail,
  );
};

const dispatch = (
  term1: Expr,
  term2: Expr,
  dict: Dict,
  onSuccess: () => Expr[] | void,
  onFail: (e: Error) => void,
): Expr[] | void => {
  return match(term1, term2, [
    [Const, Const,
      (c1, c2) => (isConstEqual(c1, c2) ? onSuccess() : onFail(new Error(`${c1} !== ${c2}`)))],

    [Const, Var,
      (c1, v2) => {
        if (dict.has(v2.name)) {
          return dispatch(c1, dict.get(v2.name)!, dict, onSuccess, onFail);
        }

        dict.forEach((value, key) => {
          if (value instanceof Term) {
            dict.set(key, new Term(value.atoms.map((atom) => replaceVariable(atom, v2, c1))));
          }
        });
        dict.set(v2.name, c1);

        return onSuccess();
      }],

    [Const, Term,
      (c1, t2) => onFail(new Error(`match constant and term\n\t${c1}\n\t${t2}`))],

    [Var, Const,
      (v1, c2) => dispatch(c2, v1, dict, onSuccess, onFail)],

    [Var, Var,
      (v1, v2) => {
        if (dict.has(v1.name)) {
          return dispatch(dict.get(v1.name)!, v2, dict, onSuccess, onFail);
        }
        if (dict.has(v2.name)) {
          return dispatch(v1, dict.get(v2.name)!, dict, onSuccess, onFail);
        }

        return onSuccess();
      }],

    [Var, Term,
      (v1, t2) => {
        const newTerm = eliminateVariables(t2, dict) as Term;

        if (newTerm.atoms.some((atom) => isSameVar(atom as Var, v1))) {
          return onFail(new Error(`recursive variable in term\n\t${v1}\n\t${t2}`));
        }

        dict.forEach((value, key) => {
          if (value instanceof Term) {
            dict.set(key, new Term(value.atoms.map((atom) => replaceVariable(atom, v1, newTerm))));
          }
        });
        dict.set(v1.name, newTerm);

        return onSuccess();
      }],

    [Term, Const,
      (t1, c2) => dispatch(c2, t1, dict, onSuccess, onFail)],

    [Term, Var,
      (t1, v2) => dispatch(v2, t1, dict, onSuccess, onFail)],

    [Term, Term,
      (t1, t2) => {
        if (t1.atoms.length !== t2.atoms.length) {
          return onFail(new Error(`atom length not equal\n\t${t1}\n\t${t2}`));
        }

        return unifier(
          t1.atoms,
          t2.atoms,
          dict,
          onSuccess,
          onFail,
        );
      }],
  ], onFail);
};

const match = <T1 extends Expr, T2 extends Expr, R>(
  term1: T1,
  term2: T2,
  preds: [Function, Function, (t1: any, t2: any) => R][],
  onFail: (e: Error) => void,
) => {
  for (const [p1, p2, action] of preds) {
    if (term1 instanceof p1 && term2 instanceof p2) {
      return action(term1, term2);
    }
  }

  return onFail(new Error(`no match\n\t${term1}\n\t${term2}`));
};

const replaceVariable = (expr: Expr, variable: Var, value: Expr): Expr => {
  if (isSameVar(expr as Var, variable)) {
    return value;
  }

  if (expr instanceof Term) {
    return new Term(expr.atoms.map((atom) => replaceVariable(atom, variable, value)));
  }

  return expr;
};

const a: Expr[] = [
  new Term([new Var('gn'), new Const('franklin')]),
  new Var('bdate'),
  new Term([new Var('dmo'), new Var('dday'), new Const(1790)]),
];

const b: Expr[] = [
  new Term([new Const('ben'), new Const('franklin')]),
  new Term([new Var('bmo'), new Const(6), new Const(1706)]),
  new Term([new Const('apr'), new Const(17), new Var('dyear')]),
];

const c: Expr[] = [
  new Term([new Const('ben'), new Var('fn')]),
  new Term([new Const('jan'), new Var('bday'), new Const(1706)]),
  new Term([new Const('apr'), new Const(17), new Var('dyear')]),
];

const dict = new Map();

console.log(unify(c, unify(a, b, dict)!, dict));
console.log(dict);

