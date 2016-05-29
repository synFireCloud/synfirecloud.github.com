---
layout: post
title:  "OpenWrt编译记录"
date:   2016-01-24 17:02:00 +0800
categories: openwrt compile
---
# OpenWrt编译记录

> OpenWrt作为最为流行的无线路由器系统，其开放，安全，高效的特点广为人知
> 不过在OpenWrt的编译上还是有不少新手掉坑里(也包括我)，所以记录一下我的脱坑历史

### 1.查看硬件支持情况

可以在这个地址查看[http://wiki.openwrt.org/toh/start](http://wiki.openwrt.org/toh/start)如果上面没有那么就是OpenWrt官方并未支持，虽然可以移植但是难度较大。我使用的是Netgear	WNDR3400 V1，在支持列表内，点击进入支持情况页面，里面可以得到官方编译好的下载链接[http://downloads.openwrt.org/snapshots/trunk/brcm47xx/mips74k/openwrt-brcm47xx-mips74k-netgear-wndr3400-v1-squashfs.chk](http://downloads.openwrt.org/snapshots/trunk/brcm47xx/mips74k/openwrt-brcm47xx-mips74k-netgear-wndr3400-v1-squashfs.chk)，如果只是安装那么下载下来根据介绍安装就好，不过我们自然是要自己编译，毕竟这个版本连Lcui都没有。言归正传，修改链接改为[http://downloads.openwrt.org/snapshots/trunk/brcm47xx/mips74k/config](http://downloads.openwrt.org/snapshots/trunk/brcm47xx/mips74k/config)即可下载到这个机型默认的编译选项设置备用。

### 2.下载OpenWrt

在设备支持页面还可以找到支持这个设备的OpenWrt版本，我这个是14.07版支持，于是
下载14.07版OpenWrt
```
git clone git://git.openwrt.org/14.07/openwrt.git
```
下载15.05版即为：
```
git clone git://git.openwrt.org/15.05/openwrt.git
```
下载最新版为(开发版，不推荐使用)：
```
git clone git://git.openwrt.org/openwrt.git
```
### 3.配置OpenWrt

下载好了之后进入openwrt文件夹，然后运行下面的代码
```
./scripts/feeds update -a
./scripts/feeds install -a
```
否则Openwrt只有基本功能，没有WebGUI（Luci）,邮箱，多媒体等
然后复制第一布下载的config文件为当前目录下.config文件
之后运行
```
make menuconfig
```
会提示一些软件包未安装，安装即可，成功后就会有图形界面的配置选择程序，一般默认配置不用改，根据需要增加Luci，OpenWrt SDK等，最后保存退出。

### 4.编译OpenWrt

由于OpenWrt编译过程中会下载很多软件包，请保持互联网链接

```
make V=s -j
```

V=s   选项为输出所有信息，方便定位问题和查看进度（后面编译可以不加，输出信息会少一些）
-j    选项为使用与CPU核心数相同的作业数并行编译，提高编译速度。(使用这个偶尔会出现电脑卡死的情况，推荐使用cpu核心数减一的配置，既比如4个核心，就使用-j3)

> 在编译过程中有的软件包会因为国内特殊的网络环境而下载速度慢或者下载失败，在日志中找到软件包名称和下载链接，使用其他下载手段下载，并放到dl目录可解决。

最后编译完成，在bin目录下有生成好的刷机包可以使用。
