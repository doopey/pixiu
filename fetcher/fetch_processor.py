# -*- coding:utf8 -*-

import requests
import time
import MySQLdb

class MysqlHelper(object):
    def __init__(self, db_host, db_user, db_pw, db_name):
        """初始化"""
        self.conn = MySQLdb.connect(host=db_host, user=db_user, passwd=db_pw, db=db_name, charset='utf8')
        self.conn.autocommit(True)
        self.cur = self.conn.cursor()

    def execute(self, sql):
        """查询"""
        if sql is None or len(sql) < 10:
            return 0
        row_num = self.cur.execute(sql)
        return row_num

    def fetchone(self):
        return self.cur.fetchone()

    def fetchall(self):
        return self.cur.fetchall()

    def close_connect(self):
        """关闭连接"""
        self.cur.close()
        self.conn.close()

class FetchProcessor(object):
    def __init__(self, env):
        if "dev" == env: # 测试环境
            self.db_host = "127.0.0.1"
            self.db_user = "root"
            self.db_pw = "root"
            self.db_name = "moer"
        else:
            self.db_host = "127.0.0.1"
            self.db_user = "root"
            self.db_pw = "F2C99e549973"
            self.db_name = "moer"
        # "https://www.moer.cn/v1/group/api/msg/history?gid=16827291860993&show_type=3&ts=1510130041000&count=3"
        self.url_prefix = "https://www.moer.cn/v1/group/api/msg/history"
        self.gid = "16827291860993"
        self.show_type = "3"
        self.ts = self.get_ts()
        self.count = 200
        self.lord_id = "105745323"
        self.max_record_mid = self.get_max_record_mid() # 保存数据库中最大的mid

    def get_max_record_mid(self):
        sql = "SELECT MAX(mid) FROM msg_record"
        fetch_pass = MysqlHelper(self.db_host, self.db_user, self.db_pw, self.db_name)
        max_id = 0
        row_num = fetch_pass.execute(sql=sql)
        for idx in range(row_num):
             max_mid = fetch_pass.fetchone()[0]
        fetch_pass.close_connect()
        return max_mid

    def get_ts(self):
        return str(int(round(time.time() * 1000)))

    def build_url(self):
        return "%s?gid=%s&show_type=%s&ts=%s&count=%s" %(self.url_prefix, self.gid, self.show_type, self.ts, self.count)

    def get_lord_msg(self, url):
        has_new_msg = False
        try:
            response = requests.get(url)
        except:
            return has_new_msg
        if response.status_code != 200:
            print "status_code: %d url: %s" %(response.status_code, url)
            return has_new_msg
        json = response.json()
        if json.get("code") != 1000:
            print "json code: %d url: %s" %(json.get("code"), url)
            return has_new_msg
        data = json.get("data")
        data.sort(key = lambda x:x["mid"])
        fetch_pass = MysqlHelper(self.db_host, self.db_user, self.db_pw, self.db_name)
        for d in data:
            send_id = d.get("send")
            if send_id == self.lord_id:
                mid = d.get("mid")
                if mid > self.max_record_mid:
                    msg = d.get("msg")
                    if isinstance(msg, (str, unicode)) and '"' in msg:
                        msg = msg.replace('"', "'")
                    send_time = d.get("send_time")
                    # print mid, msg, send_time
                    sql = 'INSERT INTO msg_record (mid, send_id, msg, send_time) VALUES("%s", "%s", "%s", %s)' %(mid, send_id, msg, send_time)
                    try:
                        fetch_pass.execute(sql);
                        has_new_msg = True
                    except:
                        # print "has an error sql: %s" %(sql)
                        continue
        fetch_pass.close_connect()
        return has_new_msg

    def get_sleep_time(self, now, has_new_msg):
        if not has_new_msg:
            return 60
        if now >= "08:00" and now <= "15:30":
            return 30
        return 60

if __name__ == '__main__':
    proc = FetchProcessor("prod")
    has_new_msg = False
    while True:
        proc.ts = proc.get_ts()
        proc.max_record_mid = proc.get_max_record_mid()
        has_new_msg = proc.get_lord_msg(proc.build_url())
        now = time.strftime('%H:%M')
        sleep_time = proc.get_sleep_time(now, has_new_msg)
        time.sleep(sleep_time)
