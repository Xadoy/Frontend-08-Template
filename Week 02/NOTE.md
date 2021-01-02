学习笔记：

- 一个 css 的问题，老师说要设置`line-height`，实际上`line-height`和`vertical-align`
  貌似不起作用。在我的代码里面，`#container`（parent）必须要是`font-size: 0`

- 递归 -> 深度优先搜索。然而寻路问题适合用广度优先来解决。
- JavaScript array:
  - push + shift -> queue (or pop + unshift)
  - push + pop -> stack (or shift + unshift, though bad perf due to JavaScript
    array implementation)
- bfs 和 dfs 区别就在于数据结构，bfs->queue，dfs->stack
- Heuristic
  - A -> may not be shortest path
  - AStart -> shortest path: heurisitc value is smaller than direct distance
