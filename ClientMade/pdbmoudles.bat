@echo off
if not exist bedrock_server.pdb goto nopdb
if not exist cvdump.exe goto noexe

goto output


:nopdb
echo "没有找到 bedrock_server.pdb 文件"
echo "请将 bedrock_server.pdb 文件复制到此脚本目录下"
echo 然后重新运行此脚本.
goto exit

:noexe


:output
::bedrock_server.pdb
echo 正在生成符号文件
cvdump.exe -p bedrock_server.pdb > pdb.txt
echo 完成.
echo 请将pdb.txt文件上传至服务器,并标明版本
echo 退出.

:exit
pause
exit