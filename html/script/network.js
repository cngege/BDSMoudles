var ot; //时间
var oloaded;//大小

$(document).ready(function() {
  $.get(
    // 'http://cngege.f3322.net:6789/get',
    '/get',
    {"version":"0"},
    function(data, textStatus, xhr) {
      /*optional stuff to do after success */
      var vers = data.error.versionlist;
      $.each(vers,(i,item) => {
        $(".version_list").append($('<button type="button" name="button"></button>').text(item))
      });
    });

    //点击button后代为点击 input file
    $("#fileupload_btn").click(function(event) {
      /* Act on the event */
      $("#fileupload").click();
    });

    //点击上传按钮了
    $("#upload_btn").click(function(event) {
      /* Act on the event */
      var file = $("#fileupload")[0].files[0];
      if(file == undefined || file == ""){
        alert("请选择上传文件");
        return false;
      }

      var form = new FormData();
      form.append("pdb", file);
      form.append("type", "upload");
      form.append("token", $("#token").val());
      form.append("version", $("#version").val());
      $.ajax({
        url: "/upload",
        method: "POST",
        data: form,
        xhr: function () { //获取ajaxSettings中的xhr对象，为它的upload属性绑定progress事件的处理函数
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) { //检查upload属性是否存在
                //绑定progress事件的回调函数
                myXhr.upload.addEventListener('progress', upload_progressHandlingFunction, false);
            }
            return myXhr; //xhr对象返回给jQuery使用
        },
        success: function (result) {
            $("#result").html(result.data);
            if(result.code == 200){
              $("div.content .makedb .makedb_body .upload_box .progress_text").text("上传成功");
              $(".version_list").append($('<button type="button" name="button"></button>').text($("#version").val()))
            }else{
              $("div.content .makedb .makedb_body .upload_box .progress_text").text("[错误]:"+result.message);
            }
        },
        contentType: false, //必须false才会自动加上正确的Content-Type
        processData: false  //必须false才会避开jQuery对 formdata 的默认处理
    });
    });
});

//选择上传文件后触发
function selectfile(){
  if($("#fileupload")[0].files[0].name == "pdb.txt"){
    $("#fileupload_btn").text($("#fileupload")[0].files[0].name)
  }else{
    alert("请选择 pdb.txt文件")
  }

}

//上传进度回调函数：
function upload_progressHandlingFunction(e) {
    if (e.lengthComputable) {
        //$('progress').attr({value: e.loaded, max: e.total}); //更新数据到进度条
        //var percent = e.loaded / e.total * 100;
        //$('#progress').html(e.loaded + "/" + e.total + " bytes. " + percent.toFixed(2) + "%");
        $("div.content .makedb .makedb_body .upload_box .progress_text").text((e.loaded / e.total * 100).toFixed(2) + "%");
        if(e.loaded / e.total >= 1){
          $("div.content .makedb .makedb_body .upload_box .progress_text").text("上传成功 正在后台解析库中,请稍候……")
        }
    }
}
