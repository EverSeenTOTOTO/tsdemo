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
[= [.x e, .y.z f] d]
[= [x] [1 2]]
[= [. x] [1 2 3]] ; x = 2
[= [... x] [1 2 3]] ; x = [2 3]
[= [. [x] y] [1 [2] 3]]
[= [... 2 . y ... 6 x] [1 2 3 4 5 6 7 8]] ; x = 7, y = 4
```

## 控制流

```js
[match a
  [[and [> q a] [< p a]] foo]
  [[[regex '[a-z]+' 'g'].test a] [bar]]]

[loop [= i 0] [< i 10] 
  [if [= [% i 2] 0]
    [continue]
    [log i]]]
```

## 函数

```js

[= foo /[] 2]

[foo]

[= foo /[. z] [log [.. z 4]/[i]]

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
    [= [... x] this.vec]
    [splice this.vec [- [this.vec.len] 1] 1]
    x]]]]

[= s [stack [1 2 3]]]
[s.push 2]
[= a [s.pop]]

[= v [1 2 3]]
[= v [.. v [2]]]
[map v /[x] [+ x 1]]
[map v /[x, idx] [+ x idx]]

[= obj /[a b] [begin
  [= this.a a]
  [= this.b b]
  [log /[] [log this.b]]]]

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
[import [.program p] 'commander']
[import open 'open']
[import [.createServer] './dist/server']
[import [.version] './package.json']

[p.version version]
[p.option '-p, --port <port>' 'port' 3000]

[= opts [program.opts]]

[= p [createServer opts]]
[p.then /[port, options] [begin
    [options.logger.done 'Server started on port ' port]
    [if opts.open
      [open 'http://localhost:' port]
    ]]]
[p.catch /[e] [console.error e.stack]]
```

```js 
[export SimpleQeuue /[watcher, [= interval 300], [.text name]] [begin
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
  [= this.notify /[]
    [if this.timeoutId [ret]]
    [= this.timeoutId [setTimeout /[] [[this.dispatch] this.interval]]]]
  [= this.dispatch /[] [...]]]]
```

## BNF

```bnf
<lit> ::= <num> | <str> | <bool>
<unOp> ::= '-' | '!'
<binOp> ::= '..'
<dot> ::= '.' <id> <dot>

<objExpand> ::= '[' (<dot> <id> ',')* <dot> <id> ']'
<vecExpandItem> ::= '.' | '...' | <lit> | <id> | <expand>
<vecExpand> ::= '[' <vecExpandItem>* <vecExpandItem> ']'

<expand> ::= <objExpand> | <vecExpand>

<func> ::= '/' (<expand> | '['']') <body>

<assign> ::= '[' '=' (<id> | <expand>) <body> ']'

<binOpExpr> ::= '[' <binOp> <body> <body> ']'
<unOpExpr> ::= '[' <unOp> <body> ']'

<body> ::= <func> | <assign> | <binOpExpr> | <unOpExpr> | <id> | <lit>
<expr> ::= ('[' <expr> <expr>*']' | <body> | '['']') <dot>*
```
