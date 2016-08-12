---
layout: post
title:  "Saiku的编译与CAS集成"
date:   2016-08-11 15:24:00 +0800
categories: saiku compile cas
---
# Saiku的编译与CAS集成

## 1 下载与编译

### 1.1 源码下载

#### 1.1.1 saiku 源码下载

`git clone https://github.com/OSBI/saiku.git`

#### 1.1.2 saiku-query 源码下载

由于saiku依赖saiku-query，而目前saiku-query作为另一个独立项目并且没有加入maven仓库所以必须自行下载编译。

`git clone https://github.com/OSBI/saiku-query.git`

### 1.2 源码编译

#### 1.2.1 添加maven仓库

由于项目maven仓库源配置不完整，需要在saiku和saiku-query的pom.xml添加如下仓库配置。

```
<repository>
    <id>jasperreports</id>
    <name>jasperreports Public</name>
    <layout>default</layout>
    <url>http://jasperreports.sourceforge.net/maven2</url>
</repository>

<repository>
    <id>jboss</id>
    <name>jboss Public</name>
    <layout>default</layout>
    <url>https://repository.jboss.org/</url>
</repository>

<repository>
    <id>pentaho</id>
    <name>pentaho Public</name>
    <layout>default</layout>
    <url>http://repo.pentaho.org/content/groups/omni/</url>
</repository>

<repository>
    <id>jackpinetech</id>
    <name>jackpinetech Public</name>
    <layout>default</layout>
    <url>https://nexus.jackpinetech.com/nexus/content/groups/public/</url>
</repository>
```

并且将central仓库提到仓库列表开头，优先使用。

#### 1.2.2 修改pom.xml

1.saiku原本使用的pentaho.libs版本为TRUNK-SNAPSHOT不但经常变动而且目前仓库里这个版本损坏。
修改saiku
`<pentaho.libs.version>TRUNK-SNAPSHOT</pentaho.libs.version>`为`<pentaho.libs.version>6.1.0.1-196</pentaho.libs.version>`

2.由于pentaho:cda为zip包不是默认的jar包。
修改saiku，saiku-bi-platform-plugin-p5，saiku-bi-platform-plugin-p6

```
<dependency>
    <groupId>pentaho</groupId>
    <artifactId>cda</artifactId>
    <version>${pentaho.libs.version}</version>
</dependency>
```

为

```
<dependency>
    <groupId>pentaho</groupId>
    <artifactId>cda</artifactId>
    <version>${pentaho.libs.version}</version>
    <type>zip</type>
</dependency>
```

3.Itext软件包groupId已修改

修改siaku，saiku-bi-platform-plugin-p5，saiku-bi-platform-plugin-p6，saiku-web

```
<dependency>
    <groupId>iText</groupId>
    <artifactId>iText</artifactId>
    <version>4.2.0</version>
</dependency>
```

为

```
<dependency>
    <groupId>com.lowagie</groupId>
    <artifactId>itext</artifactId>
    <version>4.2.0</version>
</dependency>
```

4.goooglecode内jsdoctk-plugin项目已转移到其他仓库，删除saiku-ui内的

```
<pluginRepository>
    <id>jsdoctk2</id>
    <url>http://jsdoctk-plugin.googlecode.com/svn/repo</url>
</pluginRepository>
```

和

```
<repository>
    <id>jsdoctk1</id>
    <url>http://jsdoctk-plugin.googlecode.com/svn/repo</url>
</repository>
```

5.由于cas-client-core依赖的log4j-over-slf4j与slf4j-log4j冲突，修改saiku和siaku-web内

```
<dependency>
    <groupId>org.jasig.cas.client</groupId>
    <artifactId>cas-client-core</artifactId>
    <version>3.3.2</version>
</dependency>
```

为

```
<dependency>
    <groupId>org.jasig.cas.client</groupId>
    <artifactId>cas-client-core</artifactId>
    <version>3.3.2</version>
    <exclusions>
        <exclusion>
        <groupId>org.slf4j</groupId>
        <artifactId>log4j-over-slf4j</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

#### 1.2.3 编译

先在saiku-query内运行`mvn clean install -Dmaven.test.skip=true`
然后在saiku内运行`mvn clean install -Dmaven.test.skip=true`

### 1.3 运行

在saiku\/saiku-server\/target\/dist\/saiku-server内运行`./start-saiku.sh`
打开[http:\/\/localhost:8080](http://localhost:8080)即可看到效果

### 1.4 扩展

为了以后编译运行方便可将saiku-query作为saiku的子模块放到saiku文件夹然后设置为子模块。




## 2 CAS后端实现

在saiku-webapp/src/main/webapp/WEB-INF/目录下作如下操作

### 2.1 添加属性配置文件

添加如下属性配置文件到
applicationContext-spring-security-cas.properties

```
#Spring Security CAS
cas.service=http://localhost:8080/saiku/login/cas
cas.ssoserver.loginurl=https://login.hand-china.com/sso/login
cas.ssoserver.url=https://login.hand-china.com/sso
cas.ssoserver.logouturl=https://login.hand-china.com/sso/logout?service=http://localhost:3000/api/defaultCasTarget
cas.defaultUrl=http://localhost:3000/#/app/index
cas.auth.provider.key=hand_hap_cas_key_prod
```

### 2.2 启用saiku CAS 配置

修改 applicationContext-spring-security.xml

```
<import resource="applicationContext-spring-security-jdbc.xml"/>
```

为

```
<import resource="applicationContext-spring-security-cas.xml"/>
```

### 2.3 修改saiku CAS配置

修改applicationContext-spring-security-cas.xml文件

#### 2.3.1 引入属性配置文件

添加xmlns配置`xmlns:context="http://www.springframework.org/schema/context"`
并且添加如下属性文件引入

```
<context:property-placeholder
        location="/WEB-INF/applicationContext-spring-security-cas.properties"
        ignore-resource-not-found="true"
        ignore-unresolvable="true"
        order ="0" />

<context:property-placeholder
        location="file:///${ext.prop.dir}applicationContext-spring-security-cas.properties"
        ignore-resource-not-found="true"
        ignore-unresolvable="true"
        order ="-1" />

<context:property-placeholder
        location="/WEB-INF/applicationContext-spring-security-jdbc.properties"
        ignore-resource-not-found="true"
        ignore-unresolvable="true"
        order ="0" />

<context:property-placeholder
        location="file:///${ext.prop.dir}applicationContext-spring-security-jdbc.properties"
        ignore-resource-not-found="true"
        ignore-unresolvable="true"
        order ="-1" />
```

#### 2.3.2 添加数据源和userDetailsService配置

添加如下数据源配置

```
<bean id="dataSource"
      class="org.springframework.jdbc.datasource.DriverManagerDataSource">
    <property name="driverClassName" value="${jdbcauth.driver}" />
    <property name="url" value="${jdbcauth.url}"/>
    <property name="username" value="${jdbcauth.username}" />
    <property name="password" value="${jdbcauth.password}" />
</bean>
```

修改userDetailsService属性

```
<property name="authoritiesByUsernameQuery">
    <value>
    </value>
</property>
<property name="usersByUsernameQuery">
    <value>
    </value>
</property>
```

为

```
<property name="authoritiesByUsernameQuery">
    <value>
        ${jdbcauth.authoritiesquery}
    </value>
</property>
<property name="usersByUsernameQuery">
    <value>
        ${jdbcauth.usernamequery}
    </value>
</property>
```

#### 2.3.3 修改CAS相关Bean

1.修改serviceProperties属性service为${cas.service}
2.修改casEntryPoint属性loginUrl为${cas.ssoserver.loginurl}
3.修改casProcessingFilterEntryPoint属性loginUrl为${cas.ssoserver.loginurl}
4.修改ticketValidator构造参数为${cas.ssoserver.url}
5.修改casAuthenticationProvider属性key为${cas.auth.provider.key}

#### 2.3.4 修改Spring Secure配置

修改applicationContext-saiku.xml文件

```
<security:http auto-config='true' use-expressions="true"> <!--access-denied-page="/login.jsp"-->
    <security:csrf disabled="true"/>
    <security:intercept-url pattern="/serverdocs/**" access="isAnonymous()" />
    <security:intercept-url pattern="/rest/saiku/session*" access="isAnonymous() or isFullyAuthenticated()" />
    <security:intercept-url pattern="/rest/saiku/session/" access="isAnonymous() or isFullyAuthenticated()" />

    <security:intercept-url pattern="/rest/**" access="isFullyAuthenticated()" />
<security:intercept-url pattern="/json/**" access="isFullyAuthenticated()" />
<security:intercept-url pattern="/WEB-INF/classes/legacy-schema" access="isAnonymous()" />
    <security:logout logout-url="/logout"/>
<security:http-basic/>

</security:http>
```

为

```
<security:http entry-point-ref="casEntryPoint" auto-config='true' use-expressions="true"> <!--access-denied-page="/login.jsp"-->
    <security:csrf disabled="true"/>
    <security:intercept-url pattern="/serverdocs/**" access="isAnonymous()" />
    <security:intercept-url pattern="/rest/saiku/session*" access="isAnonymous() or isFullyAuthenticated()" />
    <security:intercept-url pattern="/rest/saiku/session/" access="isAnonymous() or isFullyAuthenticated()" />

    <security:intercept-url pattern="/rest/**" access="isFullyAuthenticated()" />
<security:intercept-url pattern="/json/**" access="isFullyAuthenticated()" />
<security:intercept-url pattern="/WEB-INF/classes/legacy-schema" access="isAnonymous()" />
    <security:logout logout-url="/logout"/>
<security:http-basic/>
    <security:custom-filter position="CAS_FILTER" ref="casAuthenticationFilter" />
</security:http>
```

添加了标签属性`entry-point-ref="casEntryPoint"`和添加`security:custom-filter`

#### 2.3.5 修改初始数据库配置

修改saiku-core/saiku-service/src/main/java/org/saiku/database/Database.java文件

有两段拼接的SQL，一段是添加用户，另一段是添加用户对应权限。
需要添加CAS返回的用户ID为用户表和权限表的username,Hand CAS返回为工号。

### 2.4 修改saiku源码

由于saiku默认使用用户名和密码授权，需要修改源码来配置CAS

修改saiku-core/saiku-web/src/main/java/org/saiku/web/service/SessionService.java

删除如下代码块

```
if (authenticationManager != null) {
  authenticate(req, username, password);
}
```

修改saiku-core/saiku-web/src/main/java/org/saiku/web/rest/resources/SessionResource.java

```
try {
sess = sessionService.getSession();
} catch (Exception e) {
```

为

```
try {
    sess = sessionService.getSession();
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    //session里面没有authid，而SpringSecurity里面已经授权。
    log.debug("authid:"+sess.get("authid")+" isAuthenticated:"+auth.isAuthenticated());
    if (sess.get("authid") == null && auth.isAuthenticated()) {
        //则为CAS登陆，登陆sessionService
        sessionService.login(req,null,null);
        sess = sessionService.getSession();
    }
} catch (Exception e) {
```

由于与前端交互时需要一个URL作为登陆入口

添加saiku-webapp/src/main/java/org/saiku/webapp/CasLoginController.java

```
package org.saiku.webapp;

import org.saiku.service.ISessionService;
import org.saiku.service.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.core.Context;
import java.io.IOException;
import java.util.Map;

/**
 * Created by fc on 16-8-10.
 */
@Component
@Path("/casLogin")
public class CasLoginController {
    private static final Logger log = LoggerFactory.getLogger(CasLoginController.class);

    private ISessionService sessionService;
    private UserService userService;

    public void setSessionService(ISessionService sessionService) {
        this.sessionService = sessionService;
    }

    public void setUserService(UserService userService) {
        this.userService = userService;
    }
    @GET
    public void casLogin(@Context HttpServletRequest req, @Context HttpServletResponse response) throws IOException {
        Map<String, Object> sess = null;
        try {
            sess = sessionService.getSession();
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            //session里面没有authid，而SpringSecurity里面已经授权。
            log.debug("authid:"+sess.get("authid")+" isAuthenticated:"+auth.isAuthenticated());
            if (sess.get("authid") == null && auth.isAuthenticated()) {
                //则为CAS登陆，登陆sessionService
                sessionService.login(req,null,null);
                sess = sessionService.getSession();
            }
            response.sendRedirect("/");
        } catch (Exception e) {
            response.sendError(500,e.getLocalizedMessage());
        }
    }
}
```

同时添加CasLoginController到saiku-webapp/src/main/webapp/WEB-INF/saiku-beans.xml

```
<bean id="casLoginController" class="org.saiku.webapp.CasLoginController">
    <property name="sessionService" ref="sessionService"/>
    <property name="userService" ref="userServiceBean"/>
</bean>
```



## 3 CAS前端实现

前端修改比较简单只需要修改saiku-ui/js/saiku/models/Session.js文件
替换
```
document.location.reload(false);
```

为

```
var port = 80;
if(location.port!=''){
    port = location.port;
}
var url = "https://login.hand-china.com/sso/logout?service="
 + location.protocol + '//' + location.hostname + ':' + port + '/saiku/rest/casLogin';
window.location.replace(url);
```

及登出后由刷新页面变为跳转到登出页面，并设置回调页面为登陆入口。
由于saiku登陆获取登陆信息失败时会调用登出方法，所以这个可以同时实现登出和登陆。



