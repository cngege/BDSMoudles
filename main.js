const express = require("express")
const app = express();
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const level = require('level');
const multer  = require('multer');
const request = require('request');
const server = http.Server(app);
//const os = require('os');

let setup = {};

let upload = multer({ dest:__dirname + '/upload/' });
let leveldb = {};
let ticktime = {};	//version: time:要关闭的时间刻，id=0

//检查相关文件夹是否存在以及创建文件夹
fs.exists(__dirname + '/upload/',exists=>{
	if(!exists) fs.mkdirSync(__dirname + 'upload/');
})

fs.exists(__dirname+"/setup.json",exists=>{
	//文件不存在
	if(!exists){
		setup.token = (Math.ceil(Math.random()*100)+Date.now()).toString();
		setup.dbpath = path.join(__dirname,'db');
		fs.exists(setup.dbpath,exists=>{
			if(!exists) fs.mkdirSync(setup.dbpath);
		})
		setup.versions = [];	//支持的版本
		fs.writeFile(__dirname+"/setup.json",JSON.stringify(setup,null,2),{encoding:"utf-8"},(err)=>{
			if(err){
				console.log("写入配置失败,请查清楚原因后重试");
				console.error(err);
			}else{
				console.log("第一次打开,您的相关默认设置如下,可在setup.json文件中修改,并重启脚本");
				console.log("token:%s",setup.token);
				console.log("数据库存放路径:%s",setup.dbpath);
			}
		})
		return;
	}
	//文件存在
	fs.readFile(__dirname+"/setup.json",'utf8',(err,data)=>{
		if(err){
			console.log("读取配置文件错误:");
			console.error(err);
			return;
		}
		setup = JSON.parse(data);
		fs.exists(setup.dbpath,exists=>{
			if(!exists) fs.mkdirSync(setup.dbpath);
		})
	})
})

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
* 26 - 缺少某些必要的文件
*/
/*
app.get("/:static?/*",(req, resp, next)=>{
	const {static = ""} = req.params;
	if(static == ""){
		express.static(__dirname + '/html')(req, resp, next);
		return;
	}
})*/

app.get("/*",express.static(__dirname + '/html'));

app.get("/get",(req, resp, next)=>{
	//判断版本找对应的数据库
	//判断key找对应的值
	let {version,key = '',keys = ''} = req.query;
	//key优先，有key则不会看keys
	for(i=0;i<setup.versions.length;i++){
		if(setup.versions[i] == version){
			//找到了这个数据库，读取并返回
 			if(leveldb[version] == null){
				// 30没有请求 则关闭数据库
				ticktime[version] = {};
				ticktime[version]['time'] = Date.now() + (30 * 1000);
				ticktime[version]['id'] = setInterval(function(){
					if(Date.now() > ticktime[version]['time']){
						leveldb[version].close();
						leveldb[version] = null;
						clearInterval(ticktime[version]['id']);
						delete ticktime[version];
					}
				},1000)
				leveldb[version] = level(path.join(setup.dbpath,version));
			}
			else{
				ticktime[version]['time'] = Date.now() + (30 * 1000);
			}

			if(key!= ''){
				leveldb[version].get(key,(err,v)=>{
					if(err){
						if(err.notFound)
							resp.json({code:1,message:"没有找到"+key,value:"",values:[],error:err.toString()})
						else
							resp.json({code:2,message:"获取key时出现其他错误",value:"",values:[],error:err.toString()})
					}
					else{
						resp.json({code:200,message:"success",value:v,values:[],error:""})
					}
					//leveldb[version].close();
					//leveldb[version] = null;
				})
				return;
			}
			else if(keys != '' && keys.indexOf(",") != -1){		//请求多个key
				let keys_array = keys.split(",");
				leveldb[version].getMany(keys_array,function(err,value){
					if(err){
						if(err.notFound)
							resp.json({code:1,message:"没有找到"+key,value:"",values:[],error:err.toString()})
						else
							resp.json({code:2,message:"获取key时出现其他错误",value:"",values:[],error:err.toString()})
					}else{
						for(i in value){
							if(value[i] == undefined){
								resp.json({code:1,message:`第${i}个索引值没有找到`,value:"",values:value,error:""})
								return;
							}
						}
						resp.json({code:200,message:"success",value:"",values:value,error:""});
					}
				})
				return;
			}
		}
	}
	//到这里就是没找到这个版本
	resp.json({code:0,message:"没有"+version+"版本的数据库或key值参数出现问题",value:"",values:[],error:{"versionlist":setup.versions}})
})

app.post("/upload",upload.single('pdb'),(req, resp, next)=>{
	const { token = '',version = '', type = "", url = ""} = req.body;
	if(token != setup.token){
		resp.send({code:20,message:"token error",error:""});
		return;
	}
	if(version == "" || type == ""){
		resp.send({code:21,message:"某个必填参数未赋值",error:""});
		return;
	}
	for(i=0;i<setup.versions.length;i++){
		if(version == setup.versions[i]){
			//表示存在
			resp.send({code:22,message:"database "+version+" exists",error:""});
			return;
		}
	}
	if(leveldb[version] != null){
		resp.send({code:23,message:"此版本可能已经有一个上传或下载任务了",error:""});
		return;
	}

	if(type == "upload"){
		var file = req.file;
		if(file.originalname == "pdb.txt"){
			//这里开始解析上传的文件写入数据库
			let filestr = fs.readFileSync(file.path).toString();
			WriteDBList(filestr,version);
			resp.send({code:200,message:"success",error:""});
			fs.unlink(file.path,error=>{})
		}
		else{
			resp.send({code:21,message:file.originalname+" error",error:""});
		}
		/*
		{
		  fieldname: 'pdb',
		  originalname: '2.txt',
		  encoding: '7bit',
		  mimetype: 'text/plain',
		  destination: 'upload/',
		  filename: 'c31e796a8ce5b322bfb7268482d1807e',
		  path: 'upload\\c31e796a8ce5b322bfb7268482d1807e', //Windows绝对路径Linux未知
		  size: 13
		}
		*/
	}else if(type=="download"){
		if(url){
			var savename = new Date().getTime();
			request.get(url,function(error,res,body){
				if(!error&&res.statusCode==200){
					WriteDBList(body,version);
					resp.send({code:200,message:"success",error:""});
				}else{
					resp.send({code:25,message:`下载${url}时出错`,error:error});
				}
			})
		}else{
			resp.send({code:21,message:"某个必填参数未赋值",error:""});
		}
	}else if(type=="checkfile"){		//方案三 其他方式上传-解析
		fs.exists(__dirname+"/upload/pdb.txt",exists=>{
			if(!exists){
				resp.send({code:26,message:"文件{/upload/pdb.txt}不存在",error:""});
			}else{
				let filestr = fs.readFileSync(path.join(__dirname,"/upload/pdb.txt")).toString();
				WriteDBList(filestr,version);
				fs.unlink(path.join(__dirname,"/upload/pdb.txt"),error=>{})
				resp.send({code:200,message:"success",error:""});
			}
		})
	}else if(type=="getcheckfile"){				// 查看 要解析的文件是否存在,及文件信息
		fs.stat(__dirname+"/upload/pdb.txt",(err,stats)=>{
	    if(err || !stats.isFile()){
				// 文件不存在
				resp.send({code:200,message:"success",exists:false,stats:{},error:""});
				return;
			}
			resp.send({code:200,message:"success",exists:true,stats:stats,error:""});
		})
	}
})

async function WriteDBList(file,version){
	leveldb[version] = level(path.join(setup.dbpath,version));
	let ops = [];
	let datas = file.split("\n");//\r\n
	for(i=0;i<datas.length;i++){
		//这行是要找的行
		if(datas[i].indexOf("S_PUB32:") == 0){
			let moudles = datas[i].replace("\r","").split(" ");
			let address = "0x" + moudles[1].substring(moudles[1].indexOf(":")+1,moudles[1].indexOf("]"));
			let intaddress = parseInt(address);
			if(moudles[3] == "00000002,"){
				intaddress = intaddress + 0x1000;
			}else if(moudles[3] == "00000000,"){
				intaddress = intaddress + 0x19E9000;
			}
			let item = {type:"put",key:moudles[4].toString(),value:"0x"+intaddress.toString(16)};
			ops.push(item);
			//await leveldb[version].put(moudles[4].toString(),address);
		}
	}
	/*
	leveldb[version].batch(ops,function(err){
		if(err){
			console.log("原子写入错误:{0}",err);
		}
	})
	*/
	//console.log(JSON.stringify(ops,null,2));
	var err = await leveldb[version].batch(ops);
	if(err){
		console.log("原子写入错误:{0}",err);
	}
	setup.versions.push(version);
	fs.writeFileSync(__dirname+"/setup.json",JSON.stringify(setup,null,2),{encoding:"utf-8"})
	leveldb[version].close();
	leveldb[version]=null;
	//console.log(await leveldb[version].get("jsdebuggerexception"),err=>{});
	//fs.unlink(path.join(__dirname,file.path),error=>{})
}


server.listen(+1234);
