---
layout: post
title:  "Welcome to Jekyll!"
date:   2016年 03月 20日 星期日 14:11:18 CST
categories: mooc c asm
---
## 使用glibc库函数和c语言内联汇编完成同一功能

> 使用库函数open,write,close对应系统调用完成向文件写入字符串功能

石漾男 原创作品转载请注明出处 《Linux内核分析》MOOC课程http://mooc.study.163.com/course/USTC-1000029000

###首先编写C库函数版程序

> 为了方便省略了所有错误处理

```
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>

int main(int argc ,char *argv[]){
	const char* fileName = "TestDataC.txt";
	const char* context = "This C Data\n";
	const size_t len = 12;
	int fd = open(fileName,O_RDWR|O_CREAT,0666);
	int size = write(fd,context,len);
	close(fd);
	printf("Write data size:%d\n",size);
	return 0;
}

```
编译并运行
```
$ gcc -m32 WriteFile.c -o WriteFile.elf
$ ./WriteFile.elf 
Write data size:12
$ cat TestDataC.txt 
This C Data
```
###然后编写内联汇编系统调用版程序

> 为了方便省略了所有错误处理

```
#include <stdio.h>

int main(int argc ,char *argv[]){
	const char* fileName = "TestDataAsm.txt";
	const char* context = "This Asm Data\n";
	int fd;
	int size;
	asm(
		"movl $0666,%%edx\n"
		"movl $0101,%%ecx\n" //O_WRONLY|O_CREAT=0101
		"movl %2,%%ebx\n"
		"movl $5,%%eax\n" //sys_open
		"int  $0x80\n"
		"movl %%eax,%1\n"

		"movl $14,%%edx\n" //再添加变量会出现错误：‘asm’操作数中有不可能的约束，所以使用立即数
		"movl %3,%%ecx\n"
		"movl %1,%%ebx\n"
		"movl $4,%%eax\n" //sys_write
		"int  $0x80\n"
		"movl %%eax,%0\n"

		"movl %1,%%ebx\n"
		"movl $6,%%eax\n"
		"int $0x80\n" //sys_close

		:"=m"(size),"=m"(fd)
		:"r"(fileName),"r"(context)
		:"edx","ecx","ebx","eax"
	);
	printf("Write data size:%d\n",size);
	return 0;
}
```
编译运行
```
$ gcc -m32 WriteFileAsm.c -o WriteFileAsm.elf
$ ./WriteFileAsm.elf 
Write data size:14
$ cat TestDataAsm.txt 
This Asm Data 
```

这个实验让我了解了内联汇编和AT&T汇编，系统调用的使用方法。
