# BDSMoudles
> BDS模块符号地址映射及WEB查询

## 这是什么:
一个使用NodeJS编写的 用于在线查询MCPE BDS Windows服务端符号地址的服务。

BDS插件 - 向云端请求要Hook函数的地址 - 使用此地址Hook函数 - 完成插件

BDS服务端更新后插件不需要更新

## 为什么要做这个:
官方支持 Minecraft 基岩版服务器搭建，但是却无法使用插件，包括功能性插件及反作弊插件。于是社区出现了以Hook 为原理的服务端插件模组,从官方提供的`bedrock_server.pdb`调试文件快速找出函数的偏移地址，以进行定位Hook，从而实现插件功能。

但这个方法最大的局限性就是当服务端更新后,函数的地址会出现变动,这就需要开发者手动更新插件，而往往除了要Hook的符号地址需要修改，其他地方都无需变动。试想一位开发者开发了十几二十个插件，每一次服务端更新的时候他都要不得不更新自己的插件，而插件的功能却无变动。

如果插件的被加载的时候，向云端获取当前版本的某些符号地址,使用该地址进行Hook程序,便不需要开发者重新编译修改自己的插件，然后再提交发布。

为了减轻开发者的开发负担，也旨在促进BDS社区插件发展,我做了这个服务端程序

## 为什么该服务使用NodeJS编写:
最大的原因是NodeJS的平台兼容性,方便在各大平台、架构的服务端部署 Windows Linex Mac Docker容器 等

## 我该怎么使用这个接口:
首先你需要三个信息

* 已知的接口 比如: `http://cngege.f3322.net:6789/`
* BDS版本 比如: `1.18.0.02`
* 你要查询地址的符号信息 比如: `??_EBottleItem@@UEAAPEAXI@Z` 和 `??_EKnockbackRoarGoal@@UEAAPEAXI@Z`

将你的接口后面加上get，比如:`http://cngege.f3322.net:6789/get`,使用参数`version`指定要查询的版本,使用参数`key`查询单个符号地址，或者使用参数`keys`查询多个符号地址,每个符号地址使用`,`隔开
比如:

`http://cngege.f3322.net:6789/get?version=1.18.0.02&key=??_EBottleItem@@UEAAPEAXI@Z`

`http://cngege.f3322.net:6789/get?version=1.18.0.02&keys=??_EBottleItem@@UEAAPEAXI@Z,??_EKnockbackRoarGoal@@UEAAPEAXI@Z`

返回code 为 200时查询成功, 返回其他值则看 message 以定位是什么错误

key查询时返回的结果在value中,keys查询返回的结果在values中

**code返回的值表示的含义**:

```javascript
/*回传：code
* 200 - 成功
* 0 - 没有此版本
* 1 - 数据库中没有此key 或者请求的多个key至少有一个未找到
* 2 - 获取key时出现其他错误
* 20 - 上传时token验证失败
* 21 - 上传文件类型错误或参数错误
* 22 - 上传的库已存在
* 23 - 此版本可能已经有一个上传任务了
* 24 - 解析上传文件写入数据库时出错
* 25 - 下载出错
*/
```

### 我的插件怎么使用这个服务

如果你的插件是CSR插件,可直接将 `CSCode`文件夹复制到你的项目中，并查看自述文件:[CSCode_BDSAddressWebAPI.cs.md](https://github.com/cngege/BDSMoudles/blob/main/CSCode_BDSAddressWebAPI.cs.md) 以快速使用编写好的接口

如果你的插件是其他语言编写的插件,也可以参考`CSCode/BDSAddressWebAPI.cs`文件了解插件使用接口的流程

**流程**:
1. 读取 `https://cngege.github.io/BDSMoudles/apis.json`,并反序列化,获取所有接口
2. 使用获取到的接口查询符号地址,如果接口可用,可将接口保存在本地,下次直接使用这个接口
3. 接口查询失败,从第一步获取到的接口中换个接口再次尝试
4. 所有接口都不可用则向控制台提示


## 我怎么在自己的服务器上部署这个服务:

### 部署Node
* 在你的服务器上安装Nodejs
* 克隆这个仓库到本地
* 将这几个文件和文件夹上传到你服务器的某个空目录下
* `html`，`main.js`，`package-lock.json`，`package.json `
* 打开控制台 进入这个目录
* 运行: `npm install --save-dev`等待下载所有依赖
* 下载完成后运行`node main.js`，如需放置后台则改为运行(Linux) `(node main.js &)`
* 打开项目根目录生成的`setup.json`文件,修改token和数据库保存目录(每一个版本的数据库约为30M左右)
* 重启程序
* 默认监听端口 `1234`

打开浏览器,输入 `http://[你的服务器ip]:1234/` 如果出现了一个pdb.txt上传页面则项目部署完成
### 上传pdb.txt
pdb.txt文件是管理者需要在服务端更新的时候,手动生成符号地址仓库上传到云端

* 去Minecraft官网下载 BDS Windows服务端 [官网地址](https://www.minecraft.net/zh-hans/download/server/bedrock)
* 打开克隆到本地的项目,打开`ClientMade`文件夹
* 将下载的压缩包中的`bedrock_server.pdb`文件复制到该文件夹中
* 运行: `pdbmoudles.bat` ,等待生成 `pdb.txt`文件
* 打开你部署的网页网址,在方案一中 填写token（部署时修改的）,版本(版本要对应,很重要)
* 选择本地的`pdb.txt`文件 上传
* 稍等 提示成功后全部部署完成

### 公开接口

如果你希望你的接口被任何人使用,那便克隆这个项目到你自己的仓库中，仿照`docs/apis.json`文件添加你自己的接口，然后提交PR,或者直接在我的项目中`https://github.com/cngege/BDSMoudles/issues`提交issues，附上你的接口地址等信息
