Vue.createApp({
    data() {
        return {
            userName: '',
            enterName: '',
            showInputBox: true,
            targetDay: new Date().getDate(),
            month: '',
            year: new Date().getFullYear(),
            day: [],
            ipAdress: '',
            reserve: [
                {
                    date: "",
                    time: "10:00",
                    user: [],
                },
                {
                    date: "",
                    time: "11:00",
                    user: [],
                },
                {
                    date: "",
                    time: "12:00",
                    user: [],
                },
                {
                    date: "",
                    time: "13:00",
                    user: [],
                },
                {
                    date: "",
                    time: "14:00",
                    user: [],
                },
                {
                    date: "",
                    time: "15:00",
                    user: [],
                },
                {
                    date: "",
                    time: "16:00",
                    user: [],
                },
                {
                    date: "",
                    time: "17:00",
                    user: [],
                },
                {
                    date: "",
                    time: "18:00",
                    user: [],
                },
            ],
            userReserve: [],
            reserveDay: dayjs(`${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}`).format("YYYY/MM/DD"),
            record: [
                {
                    date: '',
                    time: '',
                    user: []
                }
            ]
        }
    },
    watch: {
        userName: {
            handler(val) {
                if (val) {
                    this.showInputBox = false
                    localStorage.setItem(`test`, this.userName)
                } else {
                    this.showInputBox = true
                }

            }
        },
        record() {
            //只要記錄有變化，就更新使用者的預約狀態
            this.userReserve = this.reserve.filter(item => item.user.indexOf(this.userName) > -1)
        }
    },
    methods: {
        logout() {
            let sure = confirm("確定登出?")
            if (sure) {
                localStorage.removeItem(`test`)
                this.userName = ''
            }
        },
        getStatus() {
            let status = localStorage.getItem(`test`)
            if (!status) return
            this.userName = status
        },
        //根據時間禁用按鈕
        notAllow(item) {
            let activeDate = dayjs(`${this.year}/${new Date().getMonth() + 1}/${new Date().getDate()}`).format('YYYY/MM/DD')

            if (item.date < activeDate) {
                return true

            } else if (item.date == activeDate) {
                return item.time < dayjs(new Date().getTime()).format("HH:mm")
            }
            else {
                return false
            }

        },
        //切換日期
        showReserveList(item, update) {

            if (!update) {
                //非點擊月曆日期的更新
                this.reserveDay = dayjs(`${this.year}/${this.month}/${item}`).format("YYYY/MM/DD")
                this.targetDay = item
            }

            for (let i = 0; i < this.reserve.length; i++) {
                this.reserve[i].date = this.reserveDay
                this.reserve[i].user = []
            }

            let todayRecord = this.record.filter(item => item.date == this.reserveDay)

            //更新預約名單
            this.reserve.forEach(item => {
                for (let i = 0; i < todayRecord.length; i++) {

                    if (item.time == todayRecord[i].time) {
                        item.user = todayRecord[i].user
                    }

                }
            });
        },
        // 預約按鈕被點擊
        startReserve(index) {

            let sure = confirm('確定預約')
            if (sure) {
                if (this.userName == "") {
                    alert("尚未登入")
                    return
                }
                //檢查當前是否超過三名使用者
                if (this.reserve[index].user.length < 3) {

                    if (this.reserve[index].user.indexOf(this.userName) > -1) {
                        alert("此時段已有預約紀錄")
                        return
                    }

                    //判斷是否有同天記錄沒有就重新創建一個
                    let change = this.record.some(item => item.time === this.reserve[index].time && item.date === this.reserve[index].date)
                    //抓出record的index
                    let count = this.record.findIndex(item => item.time == this.reserve[index].time && item.date == this.reserve[index].date)
                    let newData = Array.from(this.reserve)


                    if (!change) {
                        this.reserve[index].user.push(this.userName)
                        this.record.push({
                            date: newData[index].date,
                            time: newData[index].time,
                            user: newData[index].user
                        })

                        this.record = this.record.filter(item => item.date != '')

                    }
                    else {
                        this.record[count].user.push(this.userName)
                    }

                    this.implement()

                } else {
                    alert('預約已滿')
                }
            }

        },
        // 寫入預約資訊
        implement() {
            axios.post("/reserve", {
                data: this.record
            })
                .then((res) => {

                    this.updateStatus()
                })
        },
        //更新預約資訊
        updateStatus() {

            axios.get("/reserve")
                .then((res) => {

                    if (res.data.data) {
                        this.record = res.data.data
                        //更新畫面
                        this.showReserveList(new Date().getDate(), true)
                    }
                })
        },
        // 取消預約
        cancleReserve(obj, count) {

            let index = this.record.findIndex(item => item.date == obj.date && item.time == obj.time)
            let sure = confirm('確定取消')
            if (sure) {
                if (this.reserve[count].user.indexOf(this.userName) == -1 && this.record[index].user.indexOf(this.userName) == -1) {
                    alert('沒有您的紀錄')
                    return
                }
                this.$nextTick(() => {
                    //變更ui
                    this.reserve[count].user = this.reserve[count].user.filter(item => item != this.userName)

                    // let index = this.record.findIndex(item => item.date == obj.date && item.time == obj.time)
                    //寫入資料庫紀錄
                    this.record[index].user = this.record[index].user.filter(item => item != this.userName)

                    this.implement()
                })
            }
        },
        showCanReserve(item) {
            let activeDate = dayjs(`${this.year}/${new Date().getMonth() + 1}/${new Date().getDate()}`).format('YYYYMMDD')

            let beforeDate = dayjs(` ${this.year} /${this.month}/${item}`).format('YYYYMMDD')


            return beforeDate < activeDate
        },
        getIp() {
            axios.get("/ip")
                .then((res) => {
                    //建立webSocket 即時通信
                    const socket = new WebSocket(`ws://${res.data}:8080`);//需使用ip地址

                    socket.addEventListener('open', function (event) {
                        console.log('WebSocket connected!');
                        setInterval(() => {
                            socket.send('ping');

                        }, 500);
                    });

                    socket.addEventListener('message', (event) => {//對應得事件(可自己定義)
                        this.updateStatus()
                    });

                    socket.addEventListener('error', function (event) {
                        console.log('WebSocket error: ', event);
                    });

                    socket.addEventListener('close', (event) => {
                        console.log('close')
                    });
                })
        },
        getToDay() {
            this.day = []
            let first_day = new Date(this.year, this.month - 1, 1)
            for (let i = 0; i < this.monthDay[this.month - 1] + first_day.getDay(); i++) {
                this.day.push(i - first_day.getDay() + 1)
            }

            for (let i = 0; i < this.reserve.length; i++) {
                this.reserve[i].date = this.reserveDay
            }
        },
        preNum(num) {

            if (num == 2) {
                if (this.month <= 1) this.month = 12, this.year -= 1
                else this.month -= 1

                this.getToDay()

            } else {
                this.year -= 1
                this.getToDay()
            }

        },
        nextNum(num) {

            if (num == 2) {
                if (this.month >= 12) this.month = 1, this.year++
                else this.month++
                this.getToDay()

            } else {
                this.year++
                this.getToDay()
            }
        }
    },
    computed: {
        isLeapTear() {
            return (this.year % 4 === 0 && this.year % 100 !== 0 && this.year % 400 !== 0 || this.year % 100 === 0 && this.year % 400 === 0) ? 29 : 28
        },
        monthDay() {
            return [31, this.isLeapTear, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        }
    },
    mounted() {
        this.month = dayjs(new Date()).format('YYYY-MM-DD').split('-')[1]
        this.getIp()
        this.getToDay()
        this.updateStatus()
        this.getStatus()
    },
}).mount("#app")