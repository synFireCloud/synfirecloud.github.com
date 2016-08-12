---
layout: post
title:  "Zeppelin的CAS集成"
date:   2016-08-12 23:05:20 +0800
categories: zeppelin shiro cas
---
Zeppelin项目管理的非常好基本一次编译通过没有任何问题。有插件检查编程风格，比如每行不超过100字符，加号两边加空格，缩进用2个空格等否则都会编译不通过，改源码的时候注意。

## 1 下载编译

### 1.1 下载源码：

`git clone https://github.com/apache/zeppelin.git`

本文档基于zepplin 0.6.0版本

`git checkout v0.6.0`

### 1.2 编译源码

`mvn clean install -Dmaven.test.skip=true`

### 1.3 运行zepplin

`bin/zeppelin-daemon.sh start`

打开[http://localhost:8080/](http://localhost:8080/)即可看到效果。



## 2 后端集成

### 2.1 添加shiro-cas依赖

在zeppelin和zeppelin-server的pom.xml文件增加如下依赖

```
<dependency>
  <groupId>org.apache.shiro</groupId>
  <artifactId>shiro-cas</artifactId>
  <version>1.2.3</version>
</dependency>
```

### 2.2 修改shiro配置文件

修改conf/shiro.ini为

```
#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#


[main]
sessionManager = org.apache.shiro.web.session.mgt.DefaultWebSessionManager
securityManager.sessionManager = $sessionManager
securityManager.sessionManager.globalSessionTimeout = 86400000

casFilter = org.apache.shiro.cas.CasFilter
casFilter.failureUrl = /error.jsp

casRealm = org.apache.shiro.cas.CasRealm
casRealm.defaultRoles = ROLE_USER
### Change with your own CAS server
casRealm.casServerUrlPrefix = https://login.hand-china.com/sso
### and your host name
casRealm.casService = http://localhost:8080/api/shiro-cas

casSubjectFactory = org.apache.shiro.cas.CasSubjectFactory
securityManager.subjectFactory = $casSubjectFactory

### Change with your own CAS server and your host name
shiro.loginUrl = https://login.hand-china.com/sso/login?service=http://localhost:8080/api/shiro-cas

[urls]
/api/login = anon
/api/version = anon
/api/shiro-cas = casFilter
/api/** = user
```

不要删除开头的Apache License声明，配置有插件检查协议。


### 2.3 增加登陆入口

增加与前端集成的登陆入口
zeppelin-server/src/main/java/org/apache/zeppelin/rest/CasLogin.java

```
/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.zeppelin.rest;

import org.apache.http.HttpResponse;
import org.apache.shiro.subject.Subject;
import org.apache.zeppelin.annotation.ZeppelinApi;
import org.apache.zeppelin.server.JsonResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import java.io.IOException;

/**
 * Created by fc on 16-8-11.
 */
@Path("/casLogin")
public class CasLogin {
  private static final Logger LOG = LoggerFactory.getLogger(CasLogin.class);
  @GET
  public void casLogin(@Context HttpServletResponse response) throws IOException {
    response.sendRedirect("/");
  }
}
```

同样不要删除开头的Apache License声明。

同时向
zeppelin-server/src/main/java/org/apache/zeppelin/server/ZeppelinServer.java
的getSingletons函数注册

```
CasLogin casLogin = new CasLogin();
singletons.add(casLogin);
```

### 2.4 附注

1.编译出现unkown license错误是检测到有文件没有指明license，为那个文件的开头添加Apache License声明。



## 3 前端集成

### 3.1 登入实现

修改 zeppelin-web\/src\/app\/app.js

auth函数内将

`// Handle error case`

替换为

`window.location.replace(baseUrlSrv.getRestApiBase()+'/casLogin');`

即获取授权数据失败（被shiro拦截）则跳转到登陆入口，shiro会负责授权最后由登陆入口返回。

### 3.2 登出实现

修改zeppelin-web\/src\/components\/navbar\/navbar.controller.js
$scope.logout 函数内

替换

```
setTimeout(function() {
  window.location.replace('/');
}, 1000);
```

为

```
setTimeout(function() {
  window.location.replace('https://login.hand-china.com/sso/logout?service=' + baseUrlSrv.getRestApiBase() + '/casLogin');
}, 1000);
```

在应用内登出成功后在cas服务器也登出。

### 3.3 附注

1.如果编译时出现karma:unit错误，原因是登入链接为后端提供服务，测试时之启动前端。
修改zeppelin-web\/Gruntfile.js

```
grunt.registerTask('test', [
  'clean:server',
  'wiredep',
  'concurrent:test',
  'postcss',
  'connect:test',
  'karma'
]);
```

删除 karma 为

```
grunt.registerTask('test', [
  'clean:server',
  'wiredep',
  'concurrent:test',
  'postcss',
  'connect:test'
]);
```




