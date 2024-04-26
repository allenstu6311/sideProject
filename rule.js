//判斷活二,三
function checkLive(player, position, length) {
  //當前位置也要計算，所以設定1
  let horizontal = 1; //水平
  let vertical = 1; //垂直
  let leftOblique = 1; //左斜
  let rightOblique = 1; //右斜

  let list = [];

  // 水平
  for (let i = 1; i <= length; i++) {
    if (player.includes(position + i)) {
      horizontal++;
      list.push(position + i);
    } else break;
  }
  for (let i = 1; i <= length; i++) {
    if (player.includes(position - i)) {
      horizontal++;
      list.push(position - i);
    } else break;
  }

  if (horizontal >= length + 1) {
    list.sort();
    return { head: list[0] - 1, tail: list[list.length - 1] + 1 };
  }
  // console.log(player);

  // 垂直
  for (let i = 1; i <= length; i++) {
    if (player.includes(position + i * 15)) {
      vertical++;
      list.push(position + i * 15);
    } else break;
  }
  for (let i = 1; i <= length; i++) {
    if (player.includes(position - i * 15)) {
      vertical++;
      list.push(position - i * 15);
    } else break;
  }

  if (vertical >= length + 1) {
    list.sort();
    return { head: list[0] - 15, tail: list[list.length - 1] + 15 };
  }

  // 右斜
  for (let i = 1; i <= length; i++) {
    if (player.includes(position + i * 14)) {
      leftOblique++;
      list.push(position + i * 14);
    } else break;
  }
  for (let i = 1; i <= length; i++) {
    if (player.includes(position - i * 14)) {
      leftOblique++;
      list.push(position - i * 14);
    } else break;
  }

  if (leftOblique >= length + 1) {
    list.sort();
    return { head: list[0] - 14, tail: list[list.length - 1] + 14 };
  }

  // 左斜
  for (let i = 1; i <= length; i++) {
    if (player.includes(position + i * 16)) {
      rightOblique++;
      list.push(position + i * 16);
    } else break;
  }
  for (let i = 1; i <= length; i++) {
    if (player.includes(position - i * 16)) {
      rightOblique++;
      list.push(position - i * 16);
    } else break;
  }

  if (rightOblique >= length + 1) {
    list.sort();
    return { head: list[0] - 16, tail: list[list.length - 1] + 16 };
  }

  return false;
}

//是否已經有阻擋
function checkBlocked(player1, player2, length) {
  let AiPos = [...player2].pop();
  // console.log("AiPos", AiPos, "length", length, "player1", player1);
  let isNotBlocked = true;
  let index = 0;

  while (isNotBlocked && index < player1.length - 1) {
    let position = player1[index];
    // console.log("position", position, "index", index);

    if (
      (AiPos == position + 1 && player1.includes(position - 1)) ||
      (AiPos == position - 1 && player1.includes(position + 1))
    ) {
      isNotBlocked = false;
      break;
    }
    if (
      (AiPos == position + 15 && player1.includes(position - 15)) ||
      (AiPos == position - 15 && player1.includes(position + 15))
    ) {
      isNotBlocked = false;
      break;
    }
    if (
      (AiPos == position + 14 && player1.includes(position - 14)) ||
      (AiPos == position - 14 && player1.includes(position + 14))
    ) {
      isNotBlocked = false;
      break;
    }
    if (
      (AiPos == position + 16 && player1.includes(position - 16)) ||
      (AiPos == position - 16 && player1.includes(position + 16))
    ) {
      isNotBlocked = false;
      break;
    }

    index++;
  }

  return !isNotBlocked;
}

//檢查當前局勢AI當下是否有活三
function checkAILiveThree(canSelect, player2) {
  for (let i = 0; i < canSelect.length; i++) {
    if (checkLive(player2, canSelect[i].val, 3)) return true;
  }
  return false;
}

function checkAIWin(canSelect, player2) {
  for (let i = 0; i < canSelect.length; i++) {
    if (checkLive(player2, canSelect[i].val, 4)) return true;
  }
  return false;
}
