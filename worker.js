let player1;
let player2;
let blocks;

self.addEventListener('message', function (e) {
    var data = e.data;
    console.log('data', data)
    player1 = data.player1;
    player2 = data.player2;
    blocks = data.blocks;
    var result = minimax(data.depth, data.isMax, data.position, data.alpha, data.beta);

    self.postMessage(result);
}, false);

function minimax(depth, isMax, position, alpha, beta) {
    // console.log("alpha", alpha, "beta", beta);
    // console.log(
    //   `Depth: ${depth}, isMax: ${isMax}, position: ${position}`
    // );

    if (
        depth >= 2 ||
        this.checkWin(player1, position) ||
        this.checkWin(player2, position)
    ) {
        return this.evaluateBoard(position, isMax);
    }
    let bestScore = isMax ? -Infinity : Infinity;
    let canSelect = blocks.filter((item) => !item.select);

    if (isMax) {
        let maxEval = -Infinity;
        for (let i = 0; i < canSelect.length; i++) {
            player2.push(canSelect[i].val);
            canSelect[i].select = true;

            let eval = this.minimax(
                depth + 1,
                false,
                canSelect[i].val,
                alpha,
                beta
            );
            // console.log('eval',eval)

            player2.pop();
            canSelect[i].select = false;

            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                break; // Alpha-Beta 剪枝
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < canSelect.length; i++) {
            player1.push(canSelect[i].val);
            canSelect[i].select = true;

            let eval = this.minimax(
                depth + 1,
                true,
                canSelect[i].val,
                alpha,
                beta
            );

            player1.pop();
            canSelect[i].select = false;

            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                break; // Alpha-Beta 剪枝
            }
        }
        return minEval;
    }
}

function evaluateBoard(position, isMax) {
    // console.log('evaluateBoard','position : ',position,'isMax',isMax)
    // 根据位置评估棋盘
    if (this.checkWin(player2, position)) {
        return isMax ? 10 : -10; // 如果是AI赢了，返回正值，否则返回负值
    }
    if (this.checkWin(player1, position)) {
        return isMax ? -10 : 10; // 如果是玩家赢了，返回负值，否则返回正值
    }
    // 更多评估逻辑...
    return 0;
}

function checkWin(player, position) {
    console.log("player", player);
    console.log('position',position)
    // console.log("player", player);
    //當前位置也要計算，所以設定1
    let horizontal = 1; //水平
    let vertical = 1; //垂直
    let leftOblique = 1; //左斜
    let rightOblique = 1; //右斜

    // 水平
    for (let i = 1; i <= 4; i++) {
        if (player.includes(position + i)) horizontal++;
        else break;
    }
    for (let i = 1; i <= 4; i++) {
        if (player.includes(position - i)) horizontal++;
        else break;
    }

    // 垂直
    for (let i = 1; i <= 4; i++) {
        if (player.includes(position + i * 17)) vertical++;
        else break;
    }
    for (let i = 1; i <= 4; i++) {
        if (player.includes(position - i * 17)) vertical++;
        else break;
    }

    // 左斜
    for (let i = 1; i <= 4; i++) {
        if (player.includes(position + i * 18)) leftOblique++;
        else break;
    }
    for (let i = 1; i <= 4; i++) {
        if (player.includes(position - i * 18)) leftOblique++;
        else break;
    }

    // 右斜
    for (let i = 1; i <= 4; i++) {
        if (player.includes(position + i * 16)) rightOblique++;
        else break;
    }
    for (let i = 1; i <= 4; i++) {
        if (player.includes(position - i * 16)) rightOblique++;
        else break;
    }

    if (
        horizontal >= 5 ||
        vertical >= 5 ||
        leftOblique >= 5 ||
        rightOblique >= 5
    ) {
        //   console.log("獲勝");
        return true;
    }

    return false;
}

