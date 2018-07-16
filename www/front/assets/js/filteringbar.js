$(function() {
  $.ajax({
    type: "POST",
    url: "/apis/getmodels/",
    dataType: "json",
    success: function(data) {
      // console.log(data.product);
      msg_liu1 = JSON.stringify(data);
      sessionStorage.setItem("wholeliu", msg_liu1);
      // str_liu1 = sessionStorage.getItem("wholeliu");
      // dataliu1 = JSON.parse(str_liu1);
      // var wl, sw, router;
      // for( var x in dataliu1.product){
      // mo = dataliu1.product[x];
      // if (mo.WIRELESS) {
      // wl = mo.WIRELESS;
      // } else if (mo.SWITCH) {
      // sw = mo.SWITCH;
      // } else if (mo.ROUTER) {
      // router = mo.ROUTER;
      // }
      // }
      // var f1 = new filtering('无线','交换机','路由器', wl, sw , router);
    }
  });
  filtering = function() {
    return;
	str_liu1 = sessionStorage.getItem("wholeliu");
	dataliu1 = JSON.parse(str_liu1);
	console.log(dataliu1);
	var mo1 = new Array();
	var mo2 = new Array();
	var mo3 = new Array();
	for( var x in dataliu1.data){
		console.log(x);
		var mo = dataliu1.data[x];
		if (!mo) {
			continue;
		}
		if (x == "WIRELESS") {
			mo1 = mo;
		} else if (x == "SWITCH") {
			mo2 = mo;
		} else if (x == "ROUTER") {
			mo3 = mo;
		}
	}
	var wr1 = '无线';
	var wr2 = '交换机';
	var wr3 = '路由器';
	//var mo1, mo2, mo3 = wl, sw, router;
	console.log(mo1);
	console.log(mo2);
	console.log(mo3);

    var div = $("<div id='menu'></div>").appendTo($("body"));
    var ul = $("<ul id='nav'></ul>").appendTo(div);
    var li1 = $("<li name='wireless'><a>" + wr1 + "</a></li>").appendTo(ul);
    var li2 = $("<li name='switch'><a>" + wr2 + "</a></li>").appendTo(ul);
    var li3 = $("<li name='router'><a>" + wr3 + "</a></li>").appendTo(ul);
    var div_w = $("<div name='wireless'></div>").appendTo(div);
    var div_s = $("<div name='switch'></div>").appendTo(div);
    var div_r = $("<div name='router'></div>").appendTo(div);
    var h1 = $("<h1><a href='#'>无线</a><a href='#'>全选</a></h1>").appendTo(div_w);
    var h2 = $("<h1><a href='#'>数据中心交换机</a><a href='#'>全选</a></h1>").appendTo(div_s);
    var h3 = $("<h1><a href='#'>路由器</a><a href='#'>全选</a></h1>").appendTo(div_r);
    var ul_w = $("<ul class='wireless'></ul>").appendTo(div_w);// 无线
    var ul_s = $("<ul class='switch'></ul>").appendTo(div_s);//交换机
    var ul_r = $("<ul class='router'></ul>").appendTo(div_r);//路由器
    console.log(mo1); //mo1:{model: "BCR800"}
    console.log(mo2);
    console.log(mo3);
     var over_all = JSON.parse(sessionStorage.getItem("over_all"));
    console.log("=============");
    console.log(over_all);
     var a_product = new Array();
    var i, i1, i2;

	  //无线
      for (i = 0; i < mo1.length; i++) {
		  console.log("wahaha");
		  console.log(mo1[i]);
         var r1 = mo1[i];
         var li_wir = $("<li><a>" + r1 + "</a></li>").appendTo(ul_w);
        a_product[r1] = li_wir; //关联数组的方式存储数组元素,通过一个特定的值来索引数组的
		console.log("xxxxxxxxxxxxxxx");
        console.log(a_product[r1]); //字符串
      }
	  //交换机
      for (i1 = 0; i1 < mo2.length; i1++) {
        var r2 = JSON.stringify(mo2[i1]).replace(/\"/g, "");
         var li_swi = $("<li><a>" + r2 + "</a></li>").appendTo(ul_s);
        a_product[r2] = li_swi;
		console.log("yyyyyyyyyyyyyyyyyyyy");
		console.log( a_product[r2]);
      }
	  //路由器
      for (i2 = 0; i2 < mo3.length; i2++) {
        var r3 = JSON.stringify(mo3[i2]).replace(/\"/g, "");
        var li_rou = $("<li><a>" + r3 + "</a></li>").appendTo(ul_r);
        a_product[r3] = li_rou;
		console.log("zzzzzzzzzzzzzzzzzzzzzzzz");
		console.log(a_product[r3]);
      }

    console.log("[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[");
    console.log(a_product);
    // var cae1 = $("<div class='clear'></div>").appendTo(ul_w);
    // var cae2 = $("<div class='clear'></div>").appendTo(ul_s);
    // var cae3 = $("<div class='clear'></div>").appendTo(ul_r);
    ul.children("li").click(
    function() {
      msg2 = sessionStorage.getItem("over_all");
      console.log(msg2);
      obj2 = JSON.parse(msg2);
      console.log(obj2);
	  if(obj2 !== null && obj2.prefer.hasOwnProperty("model")){
      console.log(obj2.prefer.model.ROUTER);
      for (var x4 in obj2.prefer.model.ROUTER) {
        txrout2 = obj2.prefer.model.ROUTER[x4];
        if (txrout2 !== "") {
          console.log("tian1");
          // $("<li class='arrow'><a>"+ txrout2 +"</a></li>").appendTo(ul_r);
          console.log(txrout2);
          a_product[txrout2].addClass("arrow");
          console.log(a_product[txrout2]);
        }
      }

	   // if(typeof(obj2.prefer).hasOwnProperty("ROUTER")){
      for (var x5 in obj2.prefer.model.SWITCH) {
        txswi2 = obj2.prefer.model.SWITCH[x5];
        if (txswi2 !== "") {
          console.log("tian2");
          // $("<li class='arrow'><a>"+ txswi2 +"</a></li>").appendTo(ul_s);
          a_product[txswi2].addClass("arrow");
          console.log(a_product[txswi2]);
          console.log(a_product[txswi2]);
        }
      }
	   // }
      for (var x6 in obj2.prefer.model.WIRELESS) {
        txwir2 = obj2.prefer.model.WIRELESS[x6];
        console.log("+++++++++++++++++++");
		console.log(txwir2);
        if (txwir2 !== "") {
          console.log("tian3");
          // $("<li class='arrow'><a>"+ txwir2 +"</a></li>").appendTo(ul_w);
          a_product[txwir2].addClass("arrow");
          console.log(a_product[txwir2]);
        }
      }
	 console.log("]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]");
    console.log(a_product);
	  }
      var cae1 = $("<div class='clear'></div>").appendTo(ul_w);
      var cae2 = $("<div class='clear'></div>").appendTo(ul_s);
      var cae3 = $("<div class='clear'></div>").appendTo(ul_r);
      var nm = $(this).attr("name");
      var le1 = $(this).parent().parent().find("div[name=" + nm + "]").find("li").find("a").parent().length;
      var le2 = $(this).parent().parent().find("div[name=" + nm + "]").find("li[class='arrow']").length;
      if (le1 == le2) {
        console.log("haoba");
        $(this).parent().parent().find("div[name=" + nm + "]").find("h1").find("a").last().addClass("dotted");
      }
      if ($("div[name='" + nm + "']").css("display") == "none") {
        // alert("111");
        $("div[name='" + nm + "']").css({
          display: "block"
        });
        $("div[name='" + nm + "']").siblings("div").css({
          display: "none"
        });
        if ($("h1 a:last-child").hasClass("dotted")) {
          console.log("全选");
          $("h1 a.dotted").parent().parent().find("ul").find("li").find("a").parent().addClass("arrow");
        }
      } else if ($("div[name='" + nm + "']").css("display") == "block") {
        // alert("222");
        $("div[name='" + nm + "']").css({
          display: "none"
        });
        $("div[name='" + nm + "']").siblings("div").css({
          display: "none"
        });

      }

      if ($(this).attr("class") == undefined || $(this).attr("class") == "") {
        console.log("bianse");
        if ($(this).attr("name") == "wireless") {
          $(this).addClass("wir");
          $(this).siblings().removeAttr("class");
        } else if ($(this).attr("name") == "switch") {
          $(this).addClass("swi");
          $(this).siblings().removeAttr("class");
        } else if ($(this).attr("name") == "router") {
          $(this).addClass("rot");
          $(this).siblings().removeAttr("class");
        }
      } else {
        // alert("zzz");
        $("li[name='wireless']").removeClass("wir");
        $("li[name='switch']").removeClass("swi");
        $("li[name='router']").removeClass("rot");
      }
    });
    var ul_int1 = $("<ul class='ulbut'><li><input type='button' value='确定' name='suring'/></li><li><input type='button' value='取消' name='canceling'/></li></ul>").appendTo(div_w);
    var ul_int2 = $("<ul class='ulbut'><li><input type='button' value='确定' name='suring'/></li><li><input type='button' value='取消' name='canceling'/></li></ul>").appendTo(div_s);
    var ul_int3 = $("<ul class='ulbut'><li><input type='button' value='确定' name='suring'/></li><li><input type='button' value='取消' name='canceling'/></li></ul>").appendTo(div_r);
    var le1 = $("h1 a:last-child").parent().parent().find("ul").find("li").find("a").parent().length;
    var le2 = $("h1 a:last-child").parent().parent().find("ul").find("li[class='arrow']").length;
    if (le1 == le2) {
      console.log("bbbbbbbfffff");
      $("h1 a:last-child").addClass("dotted");
    }
    $("#menu").find("div").find("li").find("a").parent().toggle(function() {
      $(this).addClass("arrow");
      // $(this).parent().parent().siblings("div").find("li").find("a").parent().removeClass("arrow");
      var le1 = $(this).parent().find("li").length;
      var le2 = $(this).parent().find("li[class='arrow']").length;
      if (le1 == le2) {
        console.log("quandui");
        $("h1 a:last-child").addClass("dotted");
        $(this).parent().find("li").addClass("arrow");
      }
    },
    function() {
      $(this).removeClass("arrow");
      // $(this).parent().parent().siblings("div").find("li").find("a").parent().removeClass("arrow");
      var le1 = $(this).parent().find("li").length;
      var le2 = $(this).parent().find("li[class='arrow']").length;
      if ((le2 == 0) || (le1 !== le2)) {
        $("h1 a:last-child").removeClass("dotted");
      }
    });

    $("h1 a:last-child").toggle(function() {
      $(this).addClass("dotted");
      $(this).parent().parent().find("ul").find("li").find("a").parent().addClass("arrow");
      // $(this).parent().parent().siblings("div").find("li").find("a").parent().removeClass("arrow");
      // if( $("h1 a:last-child").hasClass("dotted")){
      // $("this").parent().siblings("ul").find("li").find("a").parent().addClass("arrow");
      // }
    },
    function() {
      $(this).removeClass("dotted");
      $(this).parent().parent().find("ul").find("li").find("a").parent().removeClass("arrow");
      // $("#menu").find("div").find("li").find("a").parent().removeClass("arrow");
      // $(this).parent().parent().siblings("div").find("li").find("a").parent().removeClass("arrow");
    });

    $("ul.ulbut input[name='suring']").click(function() {
      // alert("kkk");
      if (ul.find("li").hasClass("wir") || ul.find("li").hasClass("swi") || ul.find("li").hasClass("rot")) {
        // alert("kaikai");
        var cla = $(this).parent().parent().parent().attr("name");
        var txt1 = ul.find("li[name='" + cla + "']").find("a").map(function() {
          return $(this).text();
        }).get().join(',');
        if (txt1 == "无线") {
          txt1 = "WIRELESS";
        } else if (txt1 == "交换机") {
          txt1 = "SWITCH";
        } else if (txt1 == "路由器") {
          txt1 = "ROUTER";
        }
        var arr1 = txt1.split(",");
        // console.log(txt1);
        console.log(arr1);
      }
      $(this).parent().parent().parent().hide();
      // $("li[name='liu']").remove();
      var txt2 = $("div[name='wireless']").find("ul[class='wireless']").find("li[class='arrow']").find("a").map(function() {
        return $(this).text();
      }).get().join(',');
      var arr2 = txt2.split(","); //wireless
      console.log(arr2);
      var txt3 = $("div[name='switch']").find("ul[class='switch']").find("li[class='arrow']").find("a").map(function() {
        return $(this).text();
      }).get().join(',');
      var arr3 = txt3.split(","); //switch
      console.log(arr3);
      var txt4 = $("div[name='router']").find("ul[class='router']").find("li[class='arrow']").find("a").map(function() {
        return $(this).text();
      }).get().join(',');
      var arr4 = txt4.split(","); //router
      console.log(arr4);
      var data1 = {
        "model": {
          "WIRELESS": arr2,
          "ROUTER": arr4,
          "SWITCH": arr3
        }
      };

      $.ajax({
        type: "POST",
        url: "/apis/preference/set_pref/",
        data: JSON.stringify(data1),
        dataType: "json",
        success: function(data) {
          msg3 = JSON.stringify(data);
          sessionStorage.setItem("over_all", msg3);

        }
      });

    });
    $("ul.ulbut input[name='canceling']").click(function() {
      $(this).parent().parent().parent().hide();
      var ne = $(this).parent().parent().parent().attr("name");
      $("#nav").find("li[name='" + ne + "']").removeAttr("class");
    });
  }
})
