学习笔记

- Javascript RegExp

  - `RegExp` objects are stateful when they have `global`or `sticky` flags set (`/g`or `/y`). Using this to iterate over multiple matches in a string of text.
  - or we could simply use string.matchAll(regexp), which will return an iterator.

- Generator & Iterator
  - Generator composition -> yield* in function*
  - Yield as a two-way commnucation channel
    -> let arg = yield xxx; usage: gen.next().value; gen.next(arg);
  - async generators -> <to_read>
