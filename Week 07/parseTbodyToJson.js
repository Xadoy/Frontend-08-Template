const target = document.getElementsByTagName("tbody")[0];
let result = [];
for (let i = 1; i < target.rows.length; i++) {
  result.push({
    [`${target.rows[0].cells[0].innerText}`]: target.rows[i].cells[0].innerText,
    [`${target.rows[0].cells[1].innerText}`]: target.rows[i].cells[1].innerText,
    [`${target.rows[0].cells[2].innerText}`]: target.rows[i].cells[2].innerText,
  });
}

// for global obj
{
  let result = [];
  const targets = document.querySelectorAll(
    "#sec-value-properties-of-the-global-object>emu-clause"
  );
  for (const target of targets) {
    result.push(target.firstElementChild.lastChild.textContent.trim());
  }
}
