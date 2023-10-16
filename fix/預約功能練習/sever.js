const express = require("express")
//nodejs內建模組 用於操作檔案系統，包括讀取檔案、寫入檔案、刪除檔案、建立目錄、刪除目錄等
const fs = require("fs")
//傳參數前要引入
const bodyParser = require('body-parser');
const os = require('os');
const WebSocket = require('ws');
let reserveData = JSON.parse(fs.readFileSync('./reserve.json', 'utf8'));
const app = express()


const server = new WebSocket.Server({ port: 8080});


function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
  
    Object.keys(interfaces).forEach((ifname) => {
      interfaces[ifname].forEach((iface) => {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          return;
        }
        addresses.push(iface.address);
      });
    });
  
    return addresses.join('');
  }


  server.on('connection', (socket) => {
    console.log('A client has connected.');
  
    // 接收訊息
    socket.on('message', (message) => {
      // console.log("message",message.toString())
      // 回覆訊息
      socket.send('update');
      // broadcast('update');
    });
    //檢察錯誤
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  
    // 監聽關閉事件
    socket.on('close', () => {
      console.log('A client has disconnected.');
    });


  });
  
//使用靜態文件
app.use(express.static(__dirname + '/views'))
//可以傳遞參數
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req,res,next)=>{

    //加標頭
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //將控制權交給下一個中間件或路由處理程序
    next();
})


//統一讀取 發送html代碼
app.get("/",(req,res)=>{
    res.sendFile(__dirname + '/views/index.html')

})

app.get("/ip",(req,res)=>{
  res.send(getLocalIpAddress())
})

app.get("/reserve",(req,res)=>{
    reserveData = JSON.parse(fs.readFileSync("./reserve.json", "utf8"));
    res.json(reserveData)
})

app.post("/reserve",(req,res)=>{

    const parameter = req.body
 
    reserveData = JSON.stringify(parameter)
  
    fs.writeFileSync('./reserve.json', reserveData);//寫入文件
    reserveData = JSON.parse(fs.readFileSync("./reserve.json", "utf8"));//讀取
    // console.log('new',reserveData.data)
   
    res.json(reserveData.data)
  
})


app.listen(3001, () => {
    console.log(`http://${getLocalIpAddress()}:3001/`)
  })