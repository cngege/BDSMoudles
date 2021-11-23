using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
//引用.NET库中的 System.Web.Extensions.dll


namespace BDSAddrApi
{
    class BDSAddressWebAPI
    {
        public static string APIURLs = "https://cngege.github.io/BDSMoudles/apis.json";

        //建议线程中调用
        public static bool GetAddress_Try(string VERSION, string[] symbols,out string[] addrs)
        {
            bool success = GetAddress_Try(VERSION,symbols, out string[] address,new Option());
            addrs  = address;
            return success;
        }

        public static bool GetAddress_Try(string VERSION,string[] symbols,out string[] addrs, Option option)
        {
            if (option.localapiinfo) Directory.CreateDirectory(option.tmppath);
            string localapi = "";

            string symbolsstr = string.Join(",", symbols);                          //将符号数组拼接成字符串以便查询
            JavaScriptSerializer apisjson = new JavaScriptSerializer();             //实例化一个API列表的JSON对象
            JavaScriptSerializer addrjson = new JavaScriptSerializer();             //实例化一个查询返回值的JSON对象

            if (option.localapiinfo && File.Exists(option.tmppath + "api.txt"))
            {
                localapi = File.ReadAllText(option.tmppath + "api.txt").Trim();
                //如果本地存储的api获取失败,则远程重新获取并选择一个有效的获取地址并保存本地
                BackAddrData address = GetAddressInfoOFAPI(String.Format("{0}?version={1}&{2}={3}", localapi, VERSION,(symbols.Length == 1)?"key": "keys", symbolsstr));
                if (address != null)
                {
                    if (address.code == 1)
                    {
                        addrs = null;
                        return false;                                               //要提示检查key是否正确,并稍候重试
                    }
                    else if (address.code == 200)
                    {
                        if (address.value != null)
                        {
                            addrs = new string[] { address.value };
                        }
                        else
                        {
                            addrs = address.values.ToArray<string>();
                        }
                        return true;
                    }
                }
            }
            string apisjsonstr = getHttpData(APIURLs);                        //通过Web查询 获取API节点
            if (String.IsNullOrEmpty(apisjsonstr))
            {
                addrs = null;
                return false;
            }
            List<Apilist> apijson = apisjson.Deserialize<List<Apilist>>(apisjsonstr);
            foreach (var item in apijson)
            {
                if (option.localapiinfo && item.url == localapi)
                {
                    continue;
                }
                BackAddrData address = GetAddressInfoOFAPI(String.Format("{0}?version={1}&{2}={3}", item.url, VERSION, (symbols.Length == 1) ? "key" : "keys", symbolsstr));
                if (address == null)
                {
                    continue;
                }
                if (address.code == 200)
                {
                    if (!String.IsNullOrEmpty(address.value))
                    {
                        addrs = new string[] { address.value };
                    }
                    else
                    {
                        addrs = address.values.ToArray<string>();
                    }
                    if (option.localapiinfo) File.WriteAllText(option.tmppath + "api.txt", item.url);
                    return true;
                    //写本地
                }
                if (address.code == 1)
                {
                    //写本地
                    if(option.localapiinfo) File.WriteAllText(option.tmppath + "api.txt", item.url);
                    addrs = null;
                    return false;                                               //要提示检查key是否正确,并稍候重试
                }
                else
                {
                    continue;
                }

            }
            addrs = null;
            return false;                                                       //要提示检查key是否正确,并稍候重试
        }

        static BackAddrData GetAddressInfoOFAPI(string api)
        {
            string addrjsonsstr = getHttpData(api);
            if (string.IsNullOrEmpty(addrjsonsstr))
            {
                return null;
            }
            JavaScriptSerializer addrjson = new JavaScriptSerializer();             //实例化一个查询返回值的JSON对象
            return addrjson.Deserialize<BackAddrData>(addrjsonsstr);
        }


        static string getHttpData(string Url,WebHeaderCollection Headers = null)
        {
            string strResult = "";
            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(Url);
                //声明一个HttpWebRequest请求
                request.Timeout = 30 * 1000;  //设置连接超时时间
                if (Headers != null)
                {
                    request.Headers = Headers;
                }
                else
                {
                    request.Headers.Set("Pragma", "no-cache");
                }
                request.Method = "GET";
                HttpWebResponse response = (HttpWebResponse)request.GetResponse();
                if (response.ToString() != "")
                {
                    Stream streamReceive = response.GetResponseStream();
                    Encoding encoding = Encoding.GetEncoding("UTF-8");
                    StreamReader streamReader = new StreamReader(streamReceive, encoding);
                    strResult = streamReader.ReadToEnd();
                }
            }
            catch
            {
                strResult = "";
            }
            return strResult;
        }
    }

    class Option
    {
        /// <summary>
        /// 是否优先使用保存本地api节点缓存,且保存本地api节点。解释:由于api节点列表挂载在GitHub，从GitHub获取节点时而出错,所以可尝试在本地保存一份节点，且下次直接从本地读取
        /// </summary>
        public bool localapiinfo = true;

        /// <summary>
        /// 如果保存或使用本地的一些信息,那么就在这个目录下进行
        /// </summary>
        public string tmppath = "plugins\\BDSAddressApi\\";
    }


    class Apilist
    {
        public string url;
        public string manager;
        public string home;
    }

    class BackAddrData
    {
        public int code;
        public string message;
        public string value;
        public List<string> values;
        public object error;
    }
}