<h2>Margin合并只发生在垂直方向</h2>
<div>
  <span class="span span-1">margin-right</span>
  <span class="span span-2">margin-left</span>
</div>

<div>
  <div class="div div-1">margin-bottom</div>
  <div class="div div-2">margin-top</div>
</div>

<h2>父子margin合并和空块自身的margin合并</h2>

<div class="parent">
  <div class="empty"></div>
</div>

<div class="div">用来检验.empty块自身的margin合并</div>

<style>
.span {
  display: inline-block;
  height: 50px;
  border: 1px solid black;
}

.span-1 {
  margin-right: 50px;
}
.span-2 {
  margin-left: 50px;
}

.div {
  height: 50px;
  border: 1px solid black;
}

.div-1 {
  margin-bottom: 50px;
}
.div-2 {
  margin-top: 50px;
}

.parent {
  border: 1px solid black;
  overflow: hidden;
}

.empty {
  margin-top: 50px;
  margin-bottom: 50px;
}
</style>
