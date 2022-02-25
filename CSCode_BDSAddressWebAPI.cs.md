# CSCode/BDSAddressWebAPI.cs

---
**对远程或者符号地址的url api进行封装**

该脚本作为CSR插件的库使用,直接集成远程地址查询
当然也可以不使用,而手动写查询的方法
下面是该脚本的使用方法:

## 原理
1. 插件原理
  * 首先BDSCSRunner将通过Rvas.hpp中的符号及地址,解析部分api
  * 并将这些api Hook后做成接口,供CSR调用
2. CSR没有集成的接口
  * Rvas.hpp只有很少的一部分接口被做成了API，其他的都被雪藏
  * 虽然可以针对PDB文件或者所需api的地址
  * 但每一次版本更新都要同步更新CSR和CSR插件,甚至仅仅只改了地址
  * 对开发者和用户都是不必要的麻烦
  * 于是我和众开发者、项目维护者将PDB生成的库文件放至云端
  * 插件只需向云端传入版本和符号即可查询到相应的地址
  * 一人受累多人受益
3. WEBAPI查询过程
  * 各API由社区提供,并挂载在服务器,每一个服务器挂载的脚本均为一个api
  * 这些API汇总到一个apis.json文件中 `https://cngege.github.io/BDSMoudles/apis.json`
  * 插件读取这个文件,获取众多API中的一个进行使用
  * 所有的API的增删改查都通过这个修改这个文件完成
4. BDSAddressWebAPI.cs
  * 该脚本将这个api的使用方法进行简单的封装
  * 将这个文件放入你的CS项目中
  * 经过简单的调用即可获取地址
  * 这个代码还不支持查看获取失败的具体原因
  * 你可自行实现该文件的代码的方法,以获取更多的功能详细的信息和兼容性

## 使用方法
 * 将CSCode文件夹复制到你的项目中去
 * 给你的项目引用 .NET库中的 `System.Web.Extensions.dll` 不必勾选复制到本地
 * 在你自己的代码中引入命名空间 `BDSAddrApi`
 * 使用静态方法 `BDSAddressWebAPI.GetAddress_Try` 查询地址
 * 使用 `Convert.ToInt32(address[0], 16);` 将查询到的字符串地址转为`int`类型

## BDSAddressWebAPI.GetAddress_Try
该方法有两个重构 依次讲解
```CSharp
   bool GetAddress_Try(string VERSION, string[] symbols,out string[] addrs)
   //string VERSION :当前服务端程序的版本,可传入CSR的 MCCSAPI.VERSION
   //string[] symbol :填入你要查询地址的符号,比如 "?write@StartGamePacket@@UEBAXAEAVBinaryStream@@@Z"
   //out string[] addrs :输出查询到的字符串地址数组,排序与传入的符号排序相同如 0x123456
   //return bool: 返回是否查询成功,如果查询失败 addrs = null
   
   //用例:
   string[] sym = new string[]{"?write@StartGamePacket@@UEBAXAEAVBinaryStream@@@Z"};
   bool success = GetAddress_Try(mapi.VERSION,sym,out string[] address);
   if(success){
      //将获取到的地址转为整数型,也可以转为IntPtr类型
      int rva = Convert.ToInt32(address[0], 16);
      Console.WriteLine("获取地址成功:{0}",address[0]);
   }
   else{
      Console.WriteLine("获取地址失败");
   }
```

```CSharp
   bool GetAddress_Try(string VERSION,string[] symbols,out string[] addrs, Option option)
   //option  选项:new Option(){localapiinfo,tmppath}
   //option localapiinfo bool(默认true) : 是否启用本地api缓存，由于apis.json文件存储在GitHub,
   //而GitHub时常访问失败所以通过开启这个选项，将可用的api保存到本地,
   //直到这个API访问失败再从apis.json找到可用的api使用并再次保存在本地
   //option tmppath string(plugins\\BDSAddressApi\\),相关信息保存在本地时的路径
   //option symbol_save bool(默认true) : 远程获取地址后将保存在本地,本地已存在要请求的地址的话将直接尝试从本地加载,不走网络
   //option mutex_wait_time int(默认50*1000) : 互斥锁超时时间 默认50秒 单位毫秒
```