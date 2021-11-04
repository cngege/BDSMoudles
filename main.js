const express = require("express")
const app = require('express')();
const http = require('http').Server(app);
const url = require('url');
const fs = require('fs');
const path = require('path');
const level = require('level');

let dbpath = path.join(__dirname,'db');			//结尾不加/
let db = {};

//检查库文件夹是否存在以及创建文件夹
fs.exists(dbpath,exists=>{
	if(!exists) fs.mkdirSync(dbpath);
})

