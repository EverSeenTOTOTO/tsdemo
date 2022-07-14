```bnf
<id> ::= [A-Z][0-9A-Z]*

<para> ::= '(' <expr> ')'

<not> ::=  '~' <leading>

<leading> ::= <id> | <para> | <not>

<and> ::= <expr> <expr>

<or> ::= <expr> '+' <expr>

<expr> ::= <leading> | <and> | <or>
```

## 消除二义性

```bnf
<expr> ::= <expr> '+' <expr1> | <expr1>
<expr1> :: <expr1> <expr2> | <expr2>
<expr2> :: <leading>
```

## 消除左递归

```bnf
<expr> ::= <expr1> ('+' <expr1>)*
<expr1> ::= <expr2> <expr2>*
```

## 汇总

```bnf
<id> ::= [A-Z][0-9A-Z]*

<para> ::= '(' <expr> ')'

<not> ::=  '~' <leading>

<leading> ::= <id> | <para> | <not>

<expr> ::= <expr1> ('+' <expr1>)*
<expr1> ::= <leading> <leading>*
```
