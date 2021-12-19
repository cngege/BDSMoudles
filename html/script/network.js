var ot; //时间
var oloaded;//大小

$(document).ready(function() {
    //获取支持的库列表
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
        $("div.content .makedb .makedb_body .upload_box .progress_text").text("你没有选择上传文件:pdb.txt")
        return false;
      }
      $("#upload_btn").attr({"disabled":"disabled"});
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
            if(result.code == 200){
              $("div.content .makedb .makedb_body .upload_box .progress_text").text($("#version").val() + " 上传成功");
              $(".version_list").append($('<button type="button" name="button"></button>').text($("#version").val()))
            }else{
              $("div.content .makedb .makedb_body .upload_box .progress_text").text("[未成功]:"+result.message);
            }
            $("#upload_btn").removeAttr('disabled');
        },
        error: function(xml,err){
            $("#upload_btn").removeAttr('disabled');
            $("div.content .makedb .makedb_body .upload_box .progress_text").text("[出现后端也没有想到的错误]:"+err);
        },
        contentType: false, //必须false才会自动加上正确的Content-Type
        processData: false  //必须false才会避开jQuery对 formdata 的默认处理
    });
    });


    // 点击远程下载按钮了
    $("#wget_download_btn").click(function(event) {
      /* Act on the event */
      $("div.content .makedb .makedb_body .wget .progress_text").text("开始下载,请稍后……");
      $("#wget_download_btn").attr({"disabled":"disabled"});
      var form = new FormData();
      form.append("type", "download");
      form.append("token", $("#token").val());
      form.append("version", $("#version").val());
      form.append("url", $("#url").val());
      $.ajax({
        url: '/upload',
        type: 'POST',
        data: form,
        success: function(result){
          if(result.code == 200){
            $("div.content .makedb .makedb_body .wget .progress_text").text($("#version").val() + " 数据库建立成功");
            $(".version_list").append($('<button type="button" name="button"></button>').text($("#version").val()))

          }else{
            $("div.content .makedb .makedb_body .wget .progress_text").text("[未成功]:"+result.message);
          }
          $("#wget_download_btn").removeAttr('disabled');
        },
        error: function(xml,err){
          $("div.content .makedb .makedb_body .wget .progress_text").text("[未知错误]:"+err);
          $("#wget_download_btn").removeAttr('disabled');
        },
        processData: false,
        contentType: false
      })
    });


    // 按下了 解析库中的 检查文件是否存在按钮
    $("#checkfile_btn").click(function(event) {
      /* Act on the event */
      $("div.content .makedb .makedb_body .analysis .checkfile_text").text("检查中……");
      $("#analysis_check_btn").attr({"disabled":"disabled"});
      var form = new FormData();
      form.append("type", "getcheckfile");
      form.append("token", $("#token").val());
      form.append("version", '0');
      $.ajax({
        url: '/upload',
        type: 'POST',
        data: form,
        success: function(result){
          if(result.code == 200){
            if(result.exists){
              $("div.content .makedb .makedb_body .analysis .checkfile_text").text("pdb.txt文件存在 大小"+(result.stats.size/1000000).toFixed(2)+"MB 创建于"+new Date(result.stats.ctimeMs).toLocaleString());
              $("#analysis_check_btn").removeAttr('disabled');
            }else{
              $("div.content .makedb .makedb_body .analysis .checkfile_text").text("没有在upload文件夹中找到pdb.txt文件");
              $("#analysis_check_btn").attr({"disabled":"disabled"});
            }
          }else{
            $("div.content .makedb .makedb_body .analysis .checkfile_text").text("[查询未成功]:"+result.message);
          }
        },
        error: function(xml,err){
          $("div.content .makedb .makedb_body .analysis .checkfile_text").text("[未知错误]:"+err);
          $("#analysis_check_btn").attr({"disabled":"disabled"});
        },
        processData: false,
        contentType: false
      })

    });


    // 按下了 解析库中的 解析并删除按钮
    $("#analysis_check_btn").click(function(event) {
      /* Act on the event */
      $("div.content .makedb .makedb_body .analysis .analysis_text").text("开始……");
      $("#analysis_check_btn").attr({"disabled":"disabled"});
      var form = new FormData();
      form.append("type", "checkfile");
      form.append("token", $("#token").val());
      form.append("version", $("#version").val());
      $.ajax({
        url: '/upload',
        type: 'POST',
        data: form,
        success: function(result){
          if(result.code == 200){
            //$("div.content .makedb .makedb_body .analysis .checkfile_text")
            $("div.content .makedb .makedb_body .analysis .analysis_text").text("解析成功");
            $(".version_list").append($('<button type="button" name="button"></button>').text($("#version").val()))
          }else if(result.code == 26){
            $("div.content .makedb .makedb_body .analysis .analysis_text").text(result.message);
          }else{
            $("div.content .makedb .makedb_body .analysis .analysis_text").text("[未成功]:"+result.message);
          }
        },
        error: function(xml,err){
          $("div.content .makedb .makedb_body .analysis .analysis_text").text("[未知错误]:"+err);
        },
        processData: false,
        contentType: false
      })

    });




    // 上传库 按钮点击后触发
    $("#upload_btn").click(function(event) {
      /* Act on the event */
      $("div.content .makedb .makedb_body .upload_box").removeClass('noactive');
      $("div.content .makedb .makedb_body .wget").addClass('noactive');
      $("div.content .makedb .makedb_body .analysis").addClass('noactive');
    });

    // 远程下载库 按钮点击后触发
    $("#wget_btn").click(function(event) {
      /* Act on the event */
      $("div.content .makedb .makedb_body .upload_box").addClass('noactive');
      $("div.content .makedb .makedb_body .wget").removeClass('noactive');
      $("div.content .makedb .makedb_body .analysis").addClass('noactive');
    });

    // 解析库按钮点击后触发
    $("#analysis_btn").click(function(event) {
      /* Act on the event */
      $("div.content .makedb .makedb_body .upload_box").addClass('noactive');
      $("div.content .makedb .makedb_body .wget").addClass('noactive');
      $("div.content .makedb .makedb_body .analysis").removeClass('noactive');
    });

});

//选择上传文件后触发
function selectfile(){
  if($("#fileupload")[0].files[0].name.toLowerCase() == "pdb.txt"){
    $("#fileupload_btn").text($("#fileupload")[0].files[0].name)
  }else{
    $("div.content .makedb .makedb_body .upload_box .progress_text").text("请选择 pdb.txt文件");
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
