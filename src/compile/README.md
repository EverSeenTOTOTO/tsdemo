# square

可用字符：

```bash
[]\;',./`-=
```

## 变量

```js
[= a 'foo']
[= b 2]
[= c [.. 1 10]]
[= d [obj 1 [obj 2 3]]]
[= [x] [1 2]]
[= [. x] [1 2 3]] ; x = 2
[= [... x] [1 2 3]] ; x = [2 3]
[= [. [x] y] [1 [2] 3]]
```

## 控制流

```js
[match a
  [[and [> q a] [< p a]] foo]
  [[[regex '[a-z]+' 'g'].test a] [bar]]]

[loop [= i 0] [< i 10] 
  [if [= [. i] 0]
    [continue]
    [log i]]]
```

## 函数

```js

[= foo /[] 2]

[foo]

[= foo /[. z] [log [.. z 4]]

[foo 'ignored' 0]

[= fib /[n]   
  [match n 
    [[in 0 1] 1]
    [... [+ 
      [fib [- n 1]] 
      [fib [- n 2]]]]]]

[/[] [/[] [2]]]
```

## 数据结构

```js
[= stack /[vec] [begin
  [= this.vec vec]
  [= this.clear /[] [= this.vec []]]
  [= this.push /[x] [= this.vec [.. this.vec [x]]]]
  [= this.pop /[] [begin
    ; line comment
    [= [... x] ;inline comment; this.vec]
    [splice this.vec [- [this.vec.len] 1] 1]
    x]]]]

[= s [stack [1 2 3]]]
[s.push 2]
[= a [s.pop]]

[= v [1 2 3]]
[= v [.. v [2]]]
[map v /[x] [+ x 1]]
[map v /[x idx] [+ x idx]]

[= obj /[a b] [begin
  [= this.a a]
  [= this.b b]
  [log /[] [log this.b]]]]

; line comment
[= o [obj 1 [obj 2 3]]]
[log o.a]
[log o.b.b]
[o.log]
```

## 注释

```lisp
; comment 
```

## demo 

```js
[import [program] 'commander']
[import open 'open']
[import [createServer] './dist/server']
[import [version] './package.json']

[program.version version]
[program.option '-p, --port <port>' 'port' 3000]

[= opts [program.opts]]

[= program [createServer opts]]
[program.then /[port options] [begin
    [options.logger.done 'Server started on port ' port]
    [if opts.open
      [open 'http://localhost:' port]
    ]]]
[program.catch /[e] [console.error e.stack]]
```

```js 
[export SimpleQeuue /[watcher interval name] [begin
  [= this.watcher watcher]
  [= this.interval interval]
  [= this.name name]
  [= this.queue []]
  [= this.enque /[e] [begin
    [match e.type 
      [== 'jump' [= this.queue [vec e]]]
      [== 'refresh' [begin 
        [= this.queue [this.queue.filter /[each] [!= each.type e.type]]]
        [this.queue.push e]]]]
    [this.notify]]]
  [= this.notify /[] [begin
    [if this.timeoutId [ret]]
    [= this.timeoutId [setTimeout /[] [[this.dispatch] this.interval]]]]]
  [= this.dispatch /[] []]]]

[= q [SimpleQeuue [watcher 300 'q']]]
```

## BNF

```bnf
<lit> ::= <num> | <str> | <bool>
<unOp> ::= '!' | '...'
<binOp> ::= '-' | '..' | '/' | '+' | '*' | '>' | '<' | '%' | '^' | '==' | '!='
<dot> ::= '.' <id> <dot>

<expandItem> ::= '.' | '...' | <id> | <expand>
<expand> ::= '[' <expandItem>+ ']'

<func> ::= '/' (<expand> | '['']') <expr>

<assign> ::= '[' '=' (<id> <dot>* | <expand>) <expr> ']'

<binOpExpr> ::= '[' <binOp> <expr> <expr> ']'
<unOpExpr> ::= '[' <unOp> <expr> ']'

<call> ::= '[' <expr>* ']' | <assign> | <binOpExpr> | <unOpExpr>

<expr> ::= (<id> | <lit> | <func> | <call>) <dot>*
```
