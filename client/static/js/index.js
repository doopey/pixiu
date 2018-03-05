/**
 * Created by chris on 17-11-13.
 */


(function () {

    var d = document,
        w = window,
        msgObj = d.getElementById("message"),
        socket;
    init();

    function init() {
        console.log("init");

        // 连接websocket后端服务器
        socket = io.connect("ws://120.78.219.206:61111");
        // socket = io.connect("ws://localhost:61111");
        socket.onopen(function() {
            console.log("握手成功");
        });

        // 监听新消息
        socket.on('message', function(objList) {
            if (objList.length > 0) {
                // 更新页面
                for (var i = 0; i < objList.length; i ++) {
                    var contentDiv = '<div>' + objList[i].msg + '</div>';
                    if (objList[i].type == 1) { // 显示图片
                        contentDiv = '<div><img src="' + objList[i].msg + '"></div>';
                    }
                    var sendTime = new Date(objList[i].sendTimestamp).format("yyyy-MM-dd hh:mm:ss");
                    var section = d.createElement('section');
                    section.className = 'robot';
                    section.innerHTML = '<span>' + sendTime + '</span>' + contentDiv;
                    section.mid = objList[i].mid;
                    msgObj.appendChild(section);
                }
            }
        });

        // 获取更多历史消息
        socket.on('moreHistory', function(objList) {
            if (objList.length > 0) {
                // 更新页面
                // msgObj.insertBefore(section, msgObj.childNodes[0])
                for (var i = 0; i < objList.length; i ++) {
                    var contentDiv = '<div>' + objList[i].msg + '</div>';
                    if (objList[i].type == 1) { // 显示图片
                        contentDiv = '<div><img src="' + objList[i].msg + '"></div>';
                    }
                    var sendTime = new Date(objList[i].sendTimestamp).format("yyyy-MM-dd hh:mm:ss");
                    var section = d.createElement('section');
                    section.className = 'robot';
                    section.innerHTML = '<span>' + sendTime + '</span>' + contentDiv;
                    section.mid = objList[i].mid;
                    msgObj.insertBefore(section, msgObj.childNodes[0])
                }
            }
        });

    }

    // 获取更多历史消息
    $("#moreHistory").click(function() {
        var firstMid = $("#message").children("section")[0].mid;
        var postdata = {
            firstMid : firstMid
        };
        socket.emit('moreHistory', postdata, function() {
        });
    });

    Date.prototype.format = function(fmt)
    { //author: meizz
        var o = {
            "M+" : this.getMonth()+1,                 //月份
            "d+" : this.getDate(),                    //日
            "h+" : this.getHours(),                   //小时
            "m+" : this.getMinutes(),                 //分
            "s+" : this.getSeconds(),                 //秒
            "q+" : Math.floor((this.getMonth()+3)/3), //季度
            "S"  : this.getMilliseconds()             //毫秒
        };
        if(/(y+)/.test(fmt))
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
        for(var k in o)
            if(new RegExp("("+ k +")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        return fmt;
    }

})();
