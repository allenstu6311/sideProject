//判斷活三
function checkLiveThree(player, position) {
  //當前位置也要計算，所以設定1
  let horizontal = 1; //水平
  let vertical = 1; //垂直
  let leftOblique = 1; //左斜
  let rightOblique = 1; //右斜

  let list = [];

  // 水平
  for (let i = 1; i <= 3; i++) {
    if (player.includes(position + i)) {
      horizontal++;
      list.push(position + i);
    } else break;
  }
  for (let i = 1; i <= 3; i++) {
    if (player.includes(position - i)) {
      horizontal++;
      list.push(position - i);
    } else break;
  }

  if (horizontal >= 4) {
    list.sort();
    return { head: list[0] - 1, tail: list[list.length - 1] + 1 };
  }
  // console.log(player);

  // 垂直
  for (let i = 1; i <= 3; i++) {
    if (player.includes(position + i * 15)) {
      vertical++;
      list.push(position + i * 15);
    } else break;
  }
  for (let i = 1; i <= 3; i++) {
    if (player.includes(position - i * 15)) {
      vertical++;
      list.push(position - i * 15);
    } else break;
  }

  if (vertical >= 4) {
    list.sort();
    return { head: list[0] - 15, tail: list[list.length - 1] + 15 };
  }

  // 左斜
  for (let i = 1; i <= 3; i++) {
    if (player.includes(position + i * 14)) {
      leftOblique++;
      list.push(position + i * 14);
    } else break;
  }
  for (let i = 1; i <= 3; i++) {
    if (player.includes(position - i * 14)) {
      leftOblique++;
      list.push(position - i * 14);
    } else break;
  }

  if (leftOblique >= 4) {
    list.sort();
    return { head: list[0] - 14, tail: list[list.length - 1] + 14 };
  }

  // 右斜
  for (let i = 1; i <= 3; i++) {
    if (player.includes(position + i * 16)) {
      rightOblique++;
      list.push(position + i * 16);
    } else break;
  }
  for (let i = 1; i <= 3; i++) {
    if (player.includes(position - i * 16)) {
      rightOblique++;
      list.push(position - i * 16);
    } else break;
  }

  if (rightOblique >= 4) {
    list.sort();
    return { head: list[0] - 16, tail: list[list.length - 1] + 16 };
  }

  // if (
  //   horizontal >= 4 ||
  //   vertical >= 4 ||
  //   leftOblique >= 4 ||
  //   rightOblique >= 4
  // ) {
  //   // console.log("活三", position);
  //   return true;
  // }

  return false;
}
