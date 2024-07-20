export class Expr {}

export class Var extends Expr {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  get [Symbol.toStringTag]() {
    return this.name;
  }
}

export class Const extends Expr {
  value: string | number;

  constructor(value: string | number) {
    super();
    this.value = value;
  }

  get [Symbol.toStringTag]() {
    return this.value.toString();
  }
}

export class Term extends Expr {
  atoms: Expr[];

  constructor(atoms: Expr[]) {
    super();
    this.atoms = atoms;
  }

  resolveWith(variable: Var, value: Expr) {
    this.atoms = this.atoms.map(each => {
      if (each instanceof Var && isVarEqual(each, variable)) {
        return value;
      }
      if (each instanceof Term) {
        return each.resolveWith(variable, value);
      }
      return each;
    });

    return this;
  }

  get [Symbol.toStringTag]() {
    return this.atoms.map(atom => atom.toString()).join(', ');
  }
}

export const isConst = (c: Expr): boolean => {
  if (c instanceof Const) return true;
  if (c instanceof Term) {
    return c.atoms.every(isConst);
  }

  return false;
};

const isConstEqual = (c0: Expr, c1: Expr) => {
  return c0 instanceof Const && c1 instanceof Const && c0.value === c1.value;
};

const isVarEqual = (v0: Expr, v1: Expr) =>
  v0 instanceof Var && v1 instanceof Var && v0.name === v1.name;

const isTermEqual = (t0: Expr, t1: Expr) => {
  if (t0 instanceof Term && t1 instanceof Term) {
    return t0.atoms.every((value, index) => {
      return isEqual(value, t1.atoms[index]);
    });
  }

  return false;
};

export const isEqual = (e0: Expr, e1: Expr): boolean =>
  isConstEqual(e0, e1) || isVarEqual(e0, e1) || isTermEqual(e0, e1);

export type Dict = Map<string, Expr>;

export const eliminateVariables = (expr: Expr, dict: Dict): Expr => {
  if (expr instanceof Var) {
    return dict.get(expr.name) || expr;
  }

  if (expr instanceof Term) {
    return new Term(expr.atoms.map(atom => eliminateVariables(atom, dict)));
  }

  return expr;
};

export const unify = (
  pattern1: Expr,
  pattern2: Expr,
  dict: Dict = new Map(),
) => {
  return dispatch(
    pattern1,
    pattern2,
    dict,
    () => eliminateVariables(pattern1, dict),
    e => {
      throw e;
    },
  );
};

const unifier = (
  pattern1: Expr[],
  pattern2: Expr[],
  dict: Dict,
  onSuccess: () => Expr | void,
  onFail: (e: Error) => void,
): Expr | void => {
  if (pattern1.length !== pattern2.length) {
    return onFail(
      new Error(`length not equal:\n\t${pattern1}\n\t${pattern2})}`),
    );
  }

  if (pattern1.length === 0) {
    return onSuccess();
  }

  return dispatch(
    pattern1[0],
    pattern2[0],
    dict,
    () =>
      unifier(pattern1.slice(1), pattern2.slice(1), dict, onSuccess, onFail),
    onFail,
  );
};

const dispatch = (
  term1: Expr,
  term2: Expr,
  dict: Dict,
  onSuccess: () => Expr | void,
  onFail: (e: Error) => void,
): Expr | void => {
  return match(
    term1,
    term2,
    [
      [
        Const,
        Const,
        (c1, c2) =>
          isConstEqual(c1, c2)
            ? onSuccess()
            : onFail(new Error(`${c1} !== ${c2}`)),
      ],

      [
        Const,
        Var,
        (c1, v2) => {
          if (dict.has(v2.name)) {
            return dispatch(c1, dict.get(v2.name)!, dict, onSuccess, onFail);
          }

          dict.set(v2.name, c1);

          return flushDict(v2, c1, dict, onSuccess, onFail);
        },
      ],

      [
        Const,
        Term,
        (c1, t2) =>
          onFail(new Error(`match constant and term\n\t${c1}\n\t${t2}`)),
      ],

      [Var, Const, (v1, c2) => dispatch(c2, v1, dict, onSuccess, onFail)],

      [
        Var,
        Var,
        (v1, v2) => {
          if (isVarEqual(v1, v2)) return onSuccess();

          if (dict.has(v1.name)) {
            return dispatch(dict.get(v1.name)!, v2, dict, onSuccess, onFail);
          }
          if (dict.has(v2.name)) {
            return dispatch(v1, dict.get(v2.name)!, dict, onSuccess, onFail);
          }

          dict.set(v1.name, v2);

          return onSuccess();
        },
      ],

      [
        Var,
        Term,
        (v1, t2) => {
          const newTerm = eliminateVariables(t2, dict) as Term;

          if (newTerm.atoms.some(atom => isVarEqual(atom as Var, v1))) {
            return onFail(
              new Error(`recursive variable in term\n\t${v1}\n\t${t2}`),
            );
          }

          const onOk = () => {
            dict.set(v1.name, newTerm);

            if (isConst(newTerm)) {
              return flushDict(v1, newTerm, dict, onSuccess, onFail);
            }

            return onSuccess();
          };

          if (dict.has(v1.name)) {
            return dispatch(dict.get(v1.name)!, newTerm, dict, onOk, onFail);
          }

          return onOk();
        },
      ],

      [Term, Const, (t1, c2) => dispatch(c2, t1, dict, onSuccess, onFail)],

      [Term, Var, (t1, v2) => dispatch(v2, t1, dict, onSuccess, onFail)],

      [
        Term,
        Term,
        (t1, t2) => {
          if (t1.atoms.length !== t2.atoms.length) {
            return onFail(new Error(`atom length not equal\n\t${t1}\n\t${t2}`));
          }

          return unifier(t1.atoms, t2.atoms, dict, onSuccess, onFail);
        },
      ],
    ],
    onFail,
  );
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

// 将dict值中所有variable出现的地方用value替换
// 替换后可能有新的变量resolved，需递归进行
const flushDict = (
  variable: Var,
  value: Expr,
  dict: Dict,
  onSuccess: () => Expr | void,
  onFail: (e: Error) => void,
) => {
  const newResolved: [Var, Expr][] = [];

  for (const [key, expr] of dict) {
    if (isVarEqual(expr, variable)) {
      dict.set(key, value);
      newResolved.push([new Var(key), value]);
    }
    if (expr instanceof Term && !isConst(expr)) {
      const newTerm = expr.resolveWith(variable, value);

      dict.set(key, newTerm);
      if (isConst(newTerm)) {
        newResolved.push([new Var(key), newTerm]);
      }
    }
  }

  const helper = (
    list: typeof newResolved,
    onOk: typeof onSuccess,
    onError: typeof onFail,
  ): ReturnType<typeof onSuccess> => {
    if (list.length === 0) return onOk();

    const first = list[0];

    return flushDict(
      first[0],
      first[1],
      dict,
      () => helper(list.slice(1), onOk, onError),
      onError,
    );
  };

  return helper(newResolved, onSuccess, onFail);
};
