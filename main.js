const express = require("express")
const app = express();
const http = require('http').Server(app);
const url = require('url');
const fs = require('fs');
const path = require('path');
const level = require('level');
const multer  = require('multer');

let setup = {};

let upload = multer({ dest: 'upload/' });
let leveldb = {};

//检查相关文件夹是否存在以及创建文件夹
fs.exists('upload/',exists=>{
	if(!exists) fs.mkdirSync('upload/');
})

fs.exists(__dirname+"/setup.json",exists=>{
	//文件不存在
	if(!exists){
		setup.token = Math.ceil(Math.random()*100)+Date.now();
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
	})
})

/*回传：code
* 200 - 成功
* 0 - 没有此版本
* 1 - 数据库中没有此key
* 20 - 上传时token验证失败
* 21 - 上传文件类型错误或参数错误
* 22 - 上传的库已存在
* 23 - 此版本可能已经有一个上传任务了
* 24 - 解析上传文件写入数据库时出错
*/
app.get("/:static?/*",(req, resp, next)=>{
	const {static = ""} = req.params;
	if(static == ""){
		express.static(__dirname + '/html')(req, resp, next);
		return;
	}
})

app.get("/get",(req, resp, next)=>{
	//判断版本找对应的数据库
	//判断key找对应的值
	let {version,key = ''} = req.query;
	for(i=0;i<setup.versions.length;i++){
		if(setup.versions[i] == version && key!= ''){
			//找到了这个数据库，读取并返回
 			if(leveldb[version] == null)
				leveldb[version] = level(setup.dbpath+"//"+version);
			/*leveldb[version].put("??_EBottleItem@@UEAAPEAXI@Z","0x003E96F0",(e)=>{
				if(e)console.log(e);
			})*/
			leveldb[version].get(key,(err,v)=>{
				if(err){
					resp.json({code:1,message:"没有找到"+key,value:"",values:{},error:err.toString()})
					return;
				}
				resp.json({code:200,message:"success",value:v,values:{},error:""})
			})
			leveldb[version].close();
			leveldb[version] = null;
			return;
		}
	}
	//到这里就是没找到这个版本
	resp.json({code:0,message:"没有"+version+"版本的数据库或key值为空",value:"",values:{},error:""})
})

app.post("/upload",upload.single('pdb'),(req, resp, next)=>{
	const { token = '',version = ''} = req.body;
	var file = req.file;
	if(token == setup.token){
		if(file.originalname == "pdb.txt"){
			//先判断这个库是否存在
			if(version == ""){
				resp.send({code:21,message:"version is null",error:""});
			}
			for(i=0;i<setup.versions.length;i++){
				if(version == setup.versions[i]){
					//表示存在
					resp.send({code:22,message:"database "+version+" exists",error:""});
					return;
				}
			}
			if(leveldb[version] == null){
				//这里开始解析上传的文件写入数据库
				let errcount = WriteDB(file,version);
				if(errcount == -1){
					resp.send({code:24,message:"解析上传文件写入数据库时出错",error:""});
				}else if(errcount == 0){
					resp.send({code:200,message:"success",error:""});
				}else{
					resp.send({code:24,message:"有"+errcount+"个值写入失败",error:""});
				}
				fs.unlink(path.join(__dirname,file.path),error=>{})
			}else{
				resp.send({code:23,message:"此版本可能已经有一个上传任务了",error:""});
			}
			
		}
		else{
			resp.send({code:21,message:file.originalname+" error",error:""});
		}
	}
	else{
		resp.send({code:20,message:"token error",error:""});
	}
	/*
	{
	  fieldname: 'pdb',
	  originalname: '2.txt',
	  encoding: '7bit',
	  mimetype: 'text/plain',
	  destination: 'upload/',
	  filename: 'c31e796a8ce5b322bfb7268482d1807e',
	  path: 'upload\\c31e796a8ce5b322bfb7268482d1807e',
	  size: 13
	}
	*/
})

function WriteDB(file,version){
	var path = file.path;
	let errorcount = 0;
	leveldb[version] = level(setup.dbpath+"//"+version);
	
	let data = fs.readFileSync(path).toString();
	let datas = data.split("\n");
	for(i=0;i<datas.length;i++){
		//这行是要找的行
		if(datas[i].indexOf("S_PUB32:") == 0){
			let moudles = datas[i].split(" ");
			let address = moudles[1].substring(moudles[1].indexOf(":")+1,moudles[1].indexOf("]"));
			
			leveldb[version].put(moudles[4].toString(),"0x"+address,(e)=>{
				if(e){
					errorcount++;
				}
			})
		}
	}
	setup.versions.push(version);
	fs.writeFile(__dirname+"/setup.json",JSON.stringify(setup,null,2),{encoding:"utf-8"},(err)=>{})
	//leveldb[version].close();
	return errorcount;
}



http.listen(+1234);