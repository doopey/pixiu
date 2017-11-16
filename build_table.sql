use moer;

CREATE TABLE `msg_record` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `mid` varchar(20) NOT NULL DEFAULT '',
  `send_id` varchar(10) NOT NULL DEFAULT '',
  `msg` varchar(100) NOT NULL DEFAULT '',
  `send_time` bigint(15) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mid` (`mid`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
