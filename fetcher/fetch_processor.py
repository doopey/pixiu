# -*- coding:utf8 -*-

import requests
import time
import sqlite3

class SqliteHelper(object):
    def __init__(self):
        self.conn = sqlite3.connect("/home/doopey/data/pixiu.db")

class FetchProcessor(object):
    def __init__(self):
        # "https://www.moer.cn/v1/group/api/msg/history?gid=16827291860993&show_type=3&ts=1510130041000&count=3"
        self.url_prefix = "https://www.moer.cn/v1/group/api/msg/history"
        self.gid = "16827291860993"
        self.show_type = "3"
        self.ts = self.get_ts()
        self.count = 100
        self.lord_id = "105745323"
        self.max_record_mid = self.get_max_record_mid() # 保存数据库中最大的mid

    def get_max_record_mid(self):
        sql = "SELECT MAX(mid) FROM msg_record"
        conn = SqliteHelper().conn
        c = conn.cursor()
        cursor = c.execute(sql)
        max_mid = "0"
        for row in cursor:
            max_mid = row[0]
        print "max_mid", max_mid
        conn.close()
        return max_mid

    def get_ts(self):
        return str(int(round(time.time() * 1000)))

    def build_url(self):
        return "%s?gid=%s&show_type=%s&ts=%s&count=%s" %(self.url_prefix, self.gid, self.show_type, self.ts, self.count)

    def get_lord_msg(self, url):
        response = requests.get(url)
        if response.status_code != 200:
            print "status_code: %d url: %s" %(response.status_code, url)
            return None
        json = response.json()
        if json.get("code") != 1000:
            print "json code: %d url: %s" %(json.get("code"), url)
            return None
        data = json.get("data")
        conn = SqliteHelper().conn
        for d in data:
            send_id = d.get("send")
            if send_id == self.lord_id:
                mid = d.get("mid")
                msg = d.get("msg")
                send_time = d.get("send_time")
                if mid > self.max_record_mid:
                    # print mid, msg, send_time
                    sql = 'INSERT INTO msg_record ("mid", "send_id", "msg", "send_time") VALUES("%s", "%s", "%s", "%s")' %(mid, send_id, msg, send_time)
                    print sql
                    c = conn.cursor()
                    c.execute(sql);
                    conn.commit()
        conn.close()


if __name__ == '__main__':
    proc = FetchProcessor()
    proc.get_lord_msg(proc.build_url())