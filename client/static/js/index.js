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
        socket.onopen(function() {
            console.log("握手成功");
        });

        // 监听新消息
        socket.on('message', function (objList) {
            if (objList.length > 0) {
                // 更新页面
                for (var i = 0; i < objList.length; i ++) {
                    var contentDiv = '<div>' + objList[i].msg + '</div>';
                    if (objList[i].type == 1) { // 显示图片
                        contentDiv = '<div><img src="' + objList[i].msg + '"></div>';
                    }
                    var usernameDiv = '<span>弱弱</span>';
                    var section = d.createElement('section');
                    section.className = 'service';
                    section.innerHTML = usernameDiv + contentDiv;
                    msgObj.appendChild(section);
                }
                // scrollToBottom();
            }
        });



    }

    function scrollToBottom() {
        w.scrollTo(0, msgObj.clientHeight);
    }


})();
