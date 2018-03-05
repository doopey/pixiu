/**
 * Created by chris on 17-11-13.
 */

var mysqlPools = [{
    // 生产环境
    host     : '127.0.0.1',
    user     : 'root',
    password : 'F2C99e549973',
    database : 'moer'
}, {
    // 测试环境
    host     : '127.0.0.1',
    user     : 'root',
    password : 'root',
    database : 'moer'
}]

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var pool = mysql.createPool(mysqlPools[0]); // 默认生产环境，如果带有dev参数，则是测试环境

process.argv.forEach(function(val, index, array) {
    if (index == 2 && val == "dev") { // 判断第一个参数是不是dev，若是，则是测试环境
        pool = mysql.createPool(mysqlPools[1]);
    }
});

app.get('/', function(req, res) {
    res.send("what can I do for you");
});

// 初始化
var socketUsers = {}
var interval = setInterval(broadcast, 10000);
var lastMid = 0;

var num = 0;
io.on('connection', function(socket) {
    console.log("a user connected");
    // var ts = new Date().getTime();
    // 通知该用户
    pushHistoryMessage(socket);
    // TODO 重启服务会导致用户再执行一遍该方法


    socketUsers[socket.id] = {'socket': socket};

    // 监听用户退出
    socket.on('disconnect', function(socket) {
        console.log("有用户退出");
        delete socketUsers[socket.id];
    });

    // 获取更多历史消息
    socket.on('moreHistory', function(obj) {
        getMoreHistory(socket, obj.firstMid);
    });

});

function broadcast() {
    var sql = 'SELECT mid, msg, type, send_time FROM msg_record WHERE mid > ' + lastMid;
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log('[getConnection ERROR] - ', err.message);
            return;
        }
        conn.query(sql, function (err, rows) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                return;
            }
            var objList = [];
            var maxId = lastMid;
            for (var i = 0; i < rows.length; i ++) {
                var obj = {
                    mid : rows[i].mid,
                    msg : rows[i].msg,
                    type: rows[i].type, // 0表示普通文本，1表示图片
                    sendTimestamp: rows[i].send_time,
                }
                objList.push(obj);
                maxId = rows[i].mid;
            }
            lastMid = maxId;
            io.emit("message", objList);
        });
        conn.release();
    });
}

// 获取更多历史消息，倒序排列
function getMoreHistory(socket, firstMid) {
    var sql = 'SELECT mid, msg, type, send_time FROM msg_record WHERE mid < ' + firstMid + ' ORDER BY mid DESC LIMIT 20';
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log('[getConnection ERROR] - ', err.message);
            return;
        }
        conn.query(sql, function (err, rows) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                return;
            }
            var objList = [];
            for (var i = 0; i < rows.length; i ++) {
                var obj = {
                    mid : rows[i].mid,
                    msg : rows[i].msg,
                    type: rows[i].type, // 0表示普通文本，1表示图片
                    sendTimestamp: rows[i].send_time,
                }
                objList.push(obj);
            }
            socket.emit("moreHistory", objList);
        });
        conn.release();
    });
}

function pushHistoryMessage(socket) {
    var sql = 'SELECT * FROM (SELECT mid, msg, type, send_time FROM msg_record ORDER BY mid DESC LIMIT 20) b ORDER BY mid';
    pool.getConnection(function (err, conn) {
        if (err) {
            console.log('[getConnection ERROR] - ', err.message);
            return;
        }
        conn.query(sql, function (err, rows) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                return;
            }
            var objList = [];
            var maxId = lastMid;
            for (var i = 0; i < rows.length; i ++) {
                var obj = {
                    mid : rows[i].mid,
                    msg : rows[i].msg,
                    type: rows[i].type, // 0表示普通文本，1表示图片
                    sendTimestamp: rows[i].send_time,
                }
                maxId = rows[i].mid;
                objList.push(obj);
            }
            if (lastMid == 0) {
                lastMid = maxId;
            }
            socket.emit("message", objList);
        });
        conn.release();
    });
}

http.listen(61111, function() {
    console.log('listening on *:61111');
});
