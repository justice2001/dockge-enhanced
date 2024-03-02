# Project Monika

这是一个 Dockge 的二次开发项目，旨在将 Dockge 修改为适合 HomeLab 的管理平台，用于管理服务器的应用。

在 Dockge 基础上加入了配置管理的功能。

Project Monika 仅为该项目代号， 并非是项目名称，项目名称还没想出来。

## 📄 TODO

### 基础UI

- [ ] 添加图标
- [x] 修改运行状态为图标

### 文件管理

项目仅仅会对一个集中的数据目录进行管理，默认使用的是 `/opt/docker` 目录。

- [x] 数据目录列出
- [x] 文件导航
- [x] 编辑文件
- [x] 保存文件
- [ ] 自动检测高亮语法
- [ ] 新建文件/文件夹
- [ ] 剪切/粘贴
- [ ] 复制/粘贴
- [ ] 重命名文件
- [ ] 删除文件
- [ ] 多选文件
- [ ] 解压压缩包

### 模版应用

- [ ] 添加使用模版创建 stack 的功能

## Docker包

如果你想体验一下，可以使用我的docker镜像: `git.mczhengyi.top/zhengyi/dockge:nightly`,下载速度会比较慢。

但这并不是正式版本，无法保证稳定运行！

## BACK

`--platform linux/amd64,linux/arm64,linux/arm/v7`
