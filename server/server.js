/**
 * Created by chris on 17-11-13.
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var pool = mysql.createPool({
    host     : '127.0.0.1',
    user     : 'root',
    password : 'root',
    database : 'moer'
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

});

function broadcast() {
    var sql = 'SELECT mid, msg FROM msg_record WHERE mid > ' + lastMid;
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
                    msg : rows[i].msg
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

function pushHistoryMessage(socket) {
    var sql = 'SELECT * FROM (SELECT mid, msg FROM msg_record ORDER BY mid DESC LIMIT 10) b ORDER BY mid';
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
                    msg : rows[i].msg
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
