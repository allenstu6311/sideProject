// import fs from "fs";
const fs = require('fs')

/**
 * 轉譯.bdt=>json
 */

fs.readFile("./data/rps.bdt", "utf8", (err, data) => {
  if (err) throw err;
  console.log('data',data);
  

  const lines = data.split("\n"); // 逐行讀取
  let games = [];

  lines.forEach((line) => {
    let parts = line.split("=["); // 分割基本資訊與對局數據

    if (parts.length < 2) return;

    let meta = parts[0].split(","); // 比賽年份、ID
    let details = parts[1].replace("]", "").split(","); // 對局詳細資訊

    let game = {
      year: meta[0],
      game_id: meta[1],
      player1: details[0],
      player2: details[1],
      winner: details[2],
      moves: details[3], // 這部分可能需要額外解析
      final_move: details[4],
    };

    games.push(game);
  });

  const jsonData = JSON.stringify(games, null, 2) //優化格式

  fs.writeFileSync("./json/chessModel2.json", jsonData, "utf-8");
});
