@echo off
if not exist bedrock_server.pdb goto nopdb
if not exist cvdump.exe goto noexe

goto output


:nopdb
echo "û���ҵ� bedrock_server.pdb �ļ�"
echo "�뽫 bedrock_server.pdb �ļ����Ƶ��˽ű�Ŀ¼��"
echo Ȼ���������д˽ű�.
goto exit

:noexe


:output
::bedrock_server.pdb
echo �������ɷ����ļ�
cvdump.exe -p bedrock_server.pdb > pdb.txt
echo ���.
echo �뽫pdb.txt�ļ��ϴ���������,�������汾
echo �˳�.

:exit
pause
exit