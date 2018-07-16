/**
 * Created by chenhuaqu on 2016/10/1.
 */

var myApp = angular.module("grcmsApp.myApp", []);
myApp.filter('brWord', function(){
	return function (par){
		var ret = par.replace(/#/g,'\r\n');
		return ret;
	}

});
myApp.factory('Data', function () {
    var url = location.href.split('/')[2];
    return{
        url: 'http://' + url
    }
});

//登录
myApp.controller('mainCtrl', function ($rootScope, $state) {
    $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
        // 如果用户不存在
        //if(!$rootScope.user || !$rootScope.user.token){
        if(toState.name=='login')return;// 如果是进入登录界面则允许
        if(!window.sessionStorage.username){
            event.preventDefault();// 取消默认跳转行为
            //$state.go(
            //     "login"
            //     // {from:fromState.name, w:'notLogin'}
            // );//跳转到登录界面
            window.location.href = '/login/';
        }
    });
    if ((window.location.hash == '#/mainCtrl')&&window.sessionStorage.username) {
        $state.go('DeviceOverview');
    }else{
        window.location.href = '/login/';
    }
});

//运营中心Controller
myApp.controller('OperationcenterCtrl', function ($scope, $state, Data) {
    $scope.sbyr= function (id) {
      $('.'+id).removeClass(id+'yr');
    };
    $scope.sbyc= function (id) {
        $('.'+id).addClass(id+'yr');
    };

});
//运营中心-集中管理Controller
myApp.controller('CentralizedManagementCtrl', function ($scope, Data) {
    $('.menuactive').click(function () {
        $(this).parent().nextAll().removeClass('active');
        $(this).parent().prevAll().removeClass('active');
        $(this).parent().addClass('active');
    });
});
//运营中心-集中管理-设备概览
myApp.controller('deviceOverviewCtrl', function ($scope, Data,$timeout ,$state) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='';
    var getInitMsg=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/over_view/'
        }).success(function (data) {
            if(data.result=='ok'){
                $scope.$apply(function(e){
                    $scope.interface_info=data.msg.interface_info;
                });
                $('#version').text(data.msg.version);
                $('#uptime').text(data.msg.uptime);
                var dateStr=parseInt(data.msg.onlineTime/86400)+'天'+parseInt((data.msg.onlineTime%86400)/3600)+'时'+parseInt((data.msg.onlineTime%3600)/60)+"分"+parseInt(data.msg.onlineTime%60)+"秒";
                $('#onlineTime').text(dateStr);
                $('#product').text(data.msg.product);
                $('#MAC').text(data.msg.MAC);
                $('#sn').text(data.msg.sn);
                $scope.getService_img({zone:data.msg.zone,system:data.msg.system});
            }else{
                rcms.message(data.msg);
            }
        }).error(function (data) {
            //rcms.message(data.msg);
        })
    };
    $scope.select_img=function(status){
        if(status=='up'){
            return 'online.png'
        }else{
            return 'offline.png'
        }
    };
    var getCpuMsg=function(){
        rcms.ajax({
            type: 'post',
            url: 'apis/cpu_status/'
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                var color1=data.msg<50?"#5cb85c":(data.msg<70?"#CBCB12":"#E53737");
                var titleTextCpu ='<font style="font-size: 20px">cpu:'+(data.msg?data.msg:0)+'%</font>';
                $('#cpu_img').highcharts({
                    fill:'white',
                    chart: {
                        backgroundColor: '#f2f3f4',
                        plotBackgroundColor: null,
                        plotBorderWidth: 0,
                        plotShadow: false
                    },
                    colors:[
                        color1,//第一个颜色
                        '#abc'//第二个颜色
                    ],
                    title: {
                        text: titleTextCpu,
                        align: 'center',
                        color:'white',
                        verticalAlign: 'middle',
                        y: 0
                    },

                    tooltip: {
                        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                    },
                    plotOptions: {
                        pie: {
                            dataLabels: {
                                enabled: false,
                                distance: 0,
                                style: {
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textShadow: '0px 1px 2px black'
                                }
                            },
                            startAngle: -180,
                            endAngle: 180,
                            center: ['50%', '50%']
                        }
                    },
                    series: [{
                        type: 'pie',
                        name: 'share',
                        innerSize: '103%',
                        data: [
                            ['使用',   data.msg?parseFloat(data.msg):0],
                            ['未使用', 100-(data.msg?parseFloat(data.msg):0)]
                        ]
                    }]
                });
            }else{
                rcms.message(data.msg);
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.getService_img=function(selectZone){
        if(!selectZone){
            selectZone={zone:0,system:0}
        }
        var color2=selectZone.zone<50?"#5cb85c":(selectZone.zone<70?"#CBCB12":"#E53737");
        var color3=selectZone.system<50?"#5cb85c":(selectZone.system<70?"#CBCB12":"#E53737");
        var titleTextZone ='<font style="font-size: 20px">内存:'+(selectZone.zone?selectZone.zone:0)+'%</font>';
        var titleTextSystem ='<font style="font-size: 20px">系统盘:'+(selectZone.system?selectZone.system:0)+'%</font>';
        $('#zone_img').highcharts({
            fill:'white',
            chart: {
                backgroundColor: '#f2f3f4',
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            colors:[
                color2,//第一个颜色
                '#abc'//第二个颜色
            ],
            title: {
                text: titleTextZone,
                align: 'center',
                color:'white',
                verticalAlign: 'middle',
                y: 0
            },

            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: false,
                        distance: 0,
                        style: {
                            fontWeight: 'bold',
                            color: 'white',
                            textShadow: '0px 1px 2px black'
                        }
                    },
                    startAngle: -180,
                    endAngle: 180,
                    center: ['50%', '50%']
                }
            },
            series: [{
                type: 'pie',
                name: 'share',
                innerSize: '103%',
                data: [
                    ['使用',   selectZone.zone?parseFloat(selectZone.zone):0],
                    ['未使用', 100-(selectZone.zone?parseFloat(selectZone.zone):0)]
                ]
            }]
        });
        $('#system_img').highcharts({
            fill:'white',
            chart: {
                backgroundColor: '#f2f3f4',
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            colors:[
                color3,//第一个颜色
                '#abc'//第二个颜色
            ],
            title: {
                text: titleTextSystem,
                align: 'center',
                color:'white',
                verticalAlign: 'middle',
                y: 0
            },

            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: false,
                        distance: 0,
                        style: {
                            fontWeight: 'bold',
                            color: 'white',
                            textShadow: '0px 1px 2px black'
                        }
                    },
                    startAngle: -180,
                    endAngle: 180,
                    center: ['50%', '50%']
                }
            },
            series: [{
                type: 'pie',
                name: 'share',
                innerSize: '103%',
                data: [
                    ['使用',   selectZone.system?parseFloat(selectZone.system):0],
                    ['未使用', 100-(selectZone.system?parseFloat(selectZone.system):0)]
                ]
            }]
        });
    };
    $scope.interfaceMsg=function(){
        $('.mouse').removeClass('expand');
        $('.menuList').removeClass('expand');
        var id = 'mouse2';
        $('#' + id)[0].className = "mouse expand";
        getIMgName(id, 2);
        $state.go('interfaceMsg');
    };
    $timeout(getInitMsg, 10);
    $timeout(getCpuMsg,10);
    timer = setInterval(getInitMsg, 10000);
    timer1 = setInterval(getCpuMsg, 10000);
    $scope.$on("$destroy",function(){
        if(timer){
            clearInterval(timer);
        }
        if(timer1){
            clearInterval(timer1);
        }
    });
});
myApp.controller('interfaceMsg', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/interfaceMsg';
    $scope.interfaceTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "interfaceTab",
        isAutoResized: false,
        columns: [{
            caption: "接口名称",
            name: "inter_name"
        },{
            caption: "接口状态",
            name: "status",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='up'){
                    option='已连接';
                }else{
                    option='未连接';
                }
                return option;
            }
        },{
            caption: "上网方式",
            name: "proto"
        },{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "网关",
            name: "gateway"
        },{
            caption: "DNS",
            name: "dns"
        },{
            caption: "上网时长"+'<span class="knockMsg" title="仅显示PPPOE拨号上网时长"><img src="assets/images/knockMsg.png"></span>',
            name: "ppp-time"
        },{
            caption: "上行流量",
            name: "rx"
        },{
            caption: "下行流量",
            name: "tx"
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    var getInitMsg=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/over_view/'
        }).success(function (data) {
            if(data.result=='ok'){
                $scope.interfaceTab.update(data.msg.interface_info);
                $("#wait_dialog").modal("hide");
            }else{
                rcms.message(data.msg);
                $("#wait_dialog").modal("hide");
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    getInitMsg();
    timer = setInterval(getInitMsg, 1000);
    $scope.$on("$destroy",function(){
        if(timer){
            clearInterval(timer);
        }
    });
});
myApp.controller('webAuth', function ($scope, Data,$timeout) {
    var ip_re = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/;
    var ips_re = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\/([1-9]|[1-2]\d|3[0-2])$/;
    var time_onlineUser;
    var timer;
    var onlineUser_key="";
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/webAuth';
    $scope.get_onlineUse =function () {
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/auth_list/'
        }).success(function (data) {
            if(data.result=='ok'){
                $scope.userTab.update($scope.search_onlineUser(data.onlineUser));
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            //rcms.message(data.msg);
        });
    };
    $scope.get_authnetwork =function (){
        $('#authnetwork_tab').html("");
        if($scope.auth.interface.length>0){//有认证网络
            var length;
            if($scope.auth.interface.length>2){
                length=2;
            }else{
                length=$scope.auth.interface.length;
            }
            for(var j=0;j<length;j++){
                if($scope.auth.mode=='bridge'){
                    if($scope.auth.interface[j].indexOf("vbr")!==-1){
                        $('<label class="inferface_label"><button type="button" class="btn-size btn btn-labeled btn-success"><span id="del'+j+'" class="btn-label"><i class="glyphicon glyphicon-trash"></i></span>'+$scope.auth.interface[j].replace("vbr","VLAN ")+'</button></label>').appendTo($('#authnetwork_tab'));
                    }else{
                        if($scope.auth.interface[j]=='br0'){
                            $('<label class="inferface_label"><button type="button" class="btn-size btn btn-labeled btn-success"><span id="del'+j+'" class="btn-label"><i class="glyphicon glyphicon-trash"></i></span>网桥1</button></label>').appendTo($('#authnetwork_tab'));
                        }else if($scope.auth.interface[j]=='br1'){
                            $('<label class="inferface_label"><button type="button" class="btn-size btn btn-labeled btn-success"><span id="del'+j+'" class="btn-label"><i class="glyphicon glyphicon-trash"></i></span>网桥2</button></label>').appendTo($('#authnetwork_tab'));
                        }else if($scope.auth.interface[j]=='br2'){
                            $('<label class="inferface_label"><button type="button" class="btn-size btn btn-labeled btn-success"><span id="del'+j+'" class="btn-label"><i class="glyphicon glyphicon-trash"></i></span>网桥3</button></label>').appendTo($('#authnetwork_tab'));
                        }
                    }
                }else if($scope.auth.mode=='gateway'){
                    if($scope.auth.interface[j].indexOf("vbr")!==-1){
                        $('<label class="inferface_label"><button type="button" class="btn-size btn btn-labeled btn-success"><span id="del'+j+'" class="btn-label"><i class="glyphicon glyphicon-trash"></i></span>'+$scope.auth.interface[j].replace("vbr","VLAN ")+'</button></label>').appendTo($('#authnetwork_tab'));
                    }else{
                        $('<label class="inferface_label"><button type="button" class="btn-size btn btn-labeled btn-success"><span id="del'+j+'" class="btn-label"><i class="glyphicon glyphicon-trash"></i></span>LAN'+(parseFloat($scope.auth.interface[j].split('br')[1])+1).toString()+'</button></label>').appendTo($('#authnetwork_tab'));
                    }
                }else{
                    if($scope.auth.interface[j].indexOf("vbr")!==-1){
                        $('<label class="inferface_label"><button type="button" class="btn-size btn btn-labeled btn-success"><span id="del'+j+'" class="btn-label"><i class="glyphicon glyphicon-trash"></i></span>'+$scope.auth.interface[j].replace("vbr","监控口 ")+'</button></label>').appendTo($('#authnetwork_tab'));
                    }else{
                        $('<label class="inferface_label"><button type="button" class="btn-size btn btn-labeled btn-success"><span id="del'+j+'" class="btn-label"><i class="glyphicon glyphicon-trash"></i></span>监控口'+(parseFloat($scope.auth.interface[j].split('br')[1])+1).toString()+'</button></label>').appendTo($('#authnetwork_tab'));
                    }
                }
                $("#del"+j).on("click",function () {
                    var num=this.id.replace("del","");
                    $scope.auth.interface.splice(num,1);
                    window.sessionStorage.auth=JSON.stringify($scope.auth);
                    $scope.get_authnetwork();
                });
            }
        }
        else{
            $('#authnetwork_tab').html('<span style="color: red;margin-left: 10px">没有选择认证网络，将添加失败</span>');
        }
    };
    $scope.limitWebAuth_session=function () {
        window.sessionStorage.auth=JSON.stringify($scope.auth);
    };
    $scope.objKeySort=function (obj) {
        var newkey = Object.keys(obj).sort();
        //先用Object内置类的keys方法获取要排序对象的属性名，再利用Array原型上的sort方法对获取的属性名进行排序，newkey是一个数组
        var newObj = {};//创建一个新的对象，用于存放排好序的键值对
        for (var i = 0; i < newkey.length; i++) {//遍历newkey数组
            newObj[newkey[i]] = obj[newkey[i]];//向新创建的对象中按照排好的顺序依次增加键值对
        }
        return newObj;//返回排好序的新对象
    };
    $scope.initWebAuth = function(){
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'auth'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                window.sessionStorage.auth=JSON.stringify(data.data);
                window.sessionStorage.interface=JSON.stringify(data.data.interface);//备份认证网络，上网认证开关关闭时还原
                $scope.auth=data.data;
                if($scope.auth.enable=='1'){
                    $('#div2')[0].className="open2";
                    $('#div1')[0].className="open1";
                    $('#webAuthForm').show();
                }else{
                    $('#div2')[0].className="close2";
                    $('#div1')[0].className="close1";
                    $('#webAuthForm').hide();
                }
                if($scope.auth.wxwifi=='1'){
                    $('#div4')[0].className="open2";
                    $('#div3')[0].className="open1";
                    $('#webLostForm').show();
                }else{
                    $('#div4')[0].className="close2";
                    $('#div3')[0].className="close1";
                    $('#webLostForm').hide();
                }
                if($scope.auth.macbypass=='1'){
                    $('#div8')[0].className="open2";
                    $('#div7')[0].className="open1";
                }else{
                    $('#div8')[0].className="close2";
                    $('#div7')[0].className="close1";
                }
                if($scope.auth.wd_escape=='1'){
                    $('#div10')[0].className="open2";
                    $('#div9')[0].className="open1";
                }else{
                    $('#div10')[0].className="close2";
                    $('#div9')[0].className="close1";
                }
                $('#auth_server').val($scope.auth.auth_server);
                $('#ssid').val($scope.auth.ssid);
                $('#port').val($scope.auth.port?$scope.auth.port:80);
                $('#auth_timeout').val($scope.auth.auth_timeout);
                $scope.get_authnetwork();
                var gridDataArr=[];
                if($scope.auth.black_domain) {
                    if ($scope.auth.black_domain.length > 0) {
                        for (var i = 0; i < $scope.auth.black_domain.length; i++) {
                            gridDataArr.push({name: $scope.auth.black_domain[i], type: 'domain', block: 'black'})
                        }
                    }
                }
                if($scope.auth.white_domain) {
                    if ($scope.auth.white_domain.length > 0) {
                        for (var i = 0; i < $scope.auth.white_domain.length; i++) {
                            gridDataArr.push({name: $scope.auth.white_domain[i], type: 'domain', block: 'white'})
                        }
                    }
                }
                if($scope.auth.white_ip) {
                    if ($scope.auth.white_ip.length > 0) {
                        for (var i = 0; i < $scope.auth.white_ip.length; i++) {
                            gridDataArr.push({name: $scope.auth.white_ip[i], type: 'ip', block: 'white'})
                        }
                    }
                }
                if($scope.auth.black_ip) {
                    if ($scope.auth.black_ip.length > 0) {
                        for (var i = 0; i < $scope.auth.black_ip.length; i++) {
                            gridDataArr.push({name: $scope.auth.black_ip[i], type: 'ip', block: 'black'})
                        }
                    }
                }
                if($scope.auth.black_mac) {
                    if ($scope.auth.black_mac.length > 0) {
                        for (var i = 0; i < $scope.auth.black_mac.length; i++) {
                            gridDataArr.push({name: $scope.auth.black_mac[i], type: 'mac', block: 'black'})
                        }
                    }
                }
                if($scope.auth.white_mac){
                    if($scope.auth.white_mac.length>0){
                        for(var i=0;i<$scope.auth.white_mac.length;i++){
                            gridDataArr.push({name:$scope.auth.white_mac[i],type:'mac',block:'white'})
                        }
                    }
                }
                if($scope.auth.white_ips){
                    if($scope.auth.white_ips.length>0){
                        for(var i=0;i<$scope.auth.white_ips.length;i++){
                            gridDataArr.push({name:$scope.auth.white_ips[i],type:'ips',block:'white'})
                        }
                    }
                }
                if($scope.auth.black_ips){
                    if($scope.auth.black_ips.length>0){
                        for(var i=0;i<$scope.auth.black_ips.length;i++){
                            gridDataArr.push({name:$scope.auth.black_ips[i],type:'ips',block:'black'})
                        }
                    }
                }
                if($scope.auth.white_ipmark) {
                    if ($scope.auth.white_ipmark.length > 0) {
                        for (var i = 0; i < $scope.auth.white_ipmark.length; i++) {
                            gridDataArr.push({name: $scope.auth.white_ipmark[i], type: 'ips', block: 'white'})
                        }
                    }
                }
                if($scope.auth.black_ipmark){
                    if($scope.auth.black_ipmark.length>0){
                        for(var i=0;i<$scope.auth.black_ipmark.length;i++){
                            gridDataArr.push({name:$scope.auth.black_ipmark[i],type:'ips',block:'black'})
                        }
                    }
                }
                if($scope.auth.white_vlan){
                    if($scope.auth.white_vlan.length>0){
                        for(var i=0;i<$scope.auth.white_vlan.length;i++){
                            gridDataArr.push({name:$scope.auth.white_vlan[i],type:'vlan',block:'white'})
                        }
                    }
                }
                if($scope.auth.white_vlans){
                    if($scope.auth.white_vlans.length>0){
                        for(var i=0;i<$scope.auth.white_vlans.length;i++){
                            gridDataArr.push({name:$scope.auth.white_vlans[i],type:'vlans',block:'white'})
                        }
                    }
                }
                $scope.limitWebAuth_session();
                $scope.gridDataArr=gridDataArr;
                getGridData();
                $("#wait_dialog").modal("hide");
            }else{
                $("#wait_dialog").modal("hide");
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        });
    };
    $scope.initWebAuth();

    $('#webLostForm').on('click',function () {
        $("#webAuth_dialog").modal('show');
        if($scope.auth.wx_escape=='1'){
            $('#div6')[0].className="open2";
            $('#div5')[0].className="open1";
            $('#webAuthLost').show();
        }else{
            $('#div6')[0].className="close2";
            $('#div5')[0].className="close1";
            $('#webAuthLost').hide();
        }
        $('#userescape_time').val($scope.auth.userescape_time);
        $('#wxerr_rangetime').val($scope.auth.wxerr_rangetime);
        $('#wxerr_count').val($scope.auth.wxerr_count);
        $('#wxerr_restime').val($scope.auth.wxerr_restime);
        $('#wmc_alivetime').val($scope.auth.wmc_alivetime);

    });
    var moreWebClick=false;
    $('#moreWebSet').on('click',function(){
       if(moreWebClick){
           $('#moreWebSetForm').hide();
           $('#moreWebSet').text('高级配置');
           moreWebClick=false;
       }else{
           $('#moreWebSetForm').show();
           $('#moreWebSet').text('收起高级');
           moreWebClick=true;
       }
    });
    $('#div1,#div3,#div5,#div7,#div9').on('click',function(){
        var divNum=this.id.split('div')[1];
        if(divNum=='5'){
            if($('#div6')[0].className=="open2") {
                $('#webAuthLost').hide();
            }else{
                $('#webAuthLost').show();
            }
        }
        if(divNum=='1'){
            if($('#div2')[0].className=="open2") {
                $('#webAuthForm').hide();
            }else{
                $('#webAuthForm').show();
            }
        }
        if(divNum=='3'){
            if($('#div4')[0].className=="open2") {
                $('#webLostForm').hide();
            }else{
                $('#webLostForm').show();
            }
        }
        $('#div'+(parseInt(divNum)+1).toString())[0].className=($('#div'+(parseInt(divNum)+1).toString())[0].className=="close2")?"open2":"close2";
        $('#div'+divNum)[0].className=($('#div'+divNum)[0].className=="close1")?"open1":"close1";
    });
    $('#webAuth_page,#limitWebAuth_page,#onlineUser_page').on('click',function(){//切换tab,定时更新取消
        var page_id=this.id;
        if(page_id=='onlineUser_page'){
            $scope.get_onlineUse();
            time_onlineUser = setInterval($scope.get_onlineUse, 5000);
        }
        else{
            if(time_onlineUser){
                clearInterval(time_onlineUser);
            }
        }
    });
    $scope.$on("$destroy",function(){
        if(time_onlineUser){
            clearInterval(time_onlineUser);
        }
        if(timer){
            clearInterval(timer);
        }
    });
    $scope.blockTypeTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "blockTypeTab",
        isAutoResized: false,
        columns: [{
            caption: "用户名单",
            name: "name",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(rowData.type=='mac'){
                    var macValue = value.split(',');
                    option=(macValue[1]?macValue[1]:'null')+' ('+macValue[0]+')';
                    return option;
                }
                if(value.toString().split(',').length<2){
                    option=value;
                }else{
                    option=value.toString().split(',')[0]+'到'+value.toString().split(',')[1];
                }
                return option;
            }
        },{
            caption: "类型",
            name: "type",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='mac'){
                    option='MAC地址';
                }else if(value=='ip'){
                    option='IP地址';
                }else if(value=='domain'){
                    option='域名';
                }else if(value=='ips'){
                    option='IP网段';
                }else if(value=='vlan'){
                    option='VLAN ID';
                }else if(value=='vlans'){
                    option='VLAN ID范围';
                }
                return option;
            }
        },{
            caption: "黑/白模式",
            name: "block",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='black'){
                    option='黑名单';
                }else{
                    option='白名单';
                }
                return option;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration = $('<span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    var blockName=[];
                    $scope.delName = rowData.name;
                    if($scope.auth.black_domain.length>0){
                        for(var i=0;i<$scope.auth.black_domain.length;i++){
                            if($scope.delName==$scope.auth.black_domain[i]){
                                $scope.auth.black_domain.splice(i,1);
                                blockName={black_domain:$scope.auth.black_domain};
                            }
                        }
                    }
                    if($scope.auth.white_domain.length>0){
                        for(var i=0;i<$scope.auth.white_domain.length;i++){
                            if($scope.delName==$scope.auth.white_domain[i]){
                                $scope.auth.white_domain.splice(i,1);
                                blockName={white_domain:$scope.auth.white_domain};
                            }
                        }
                    }
                    if($scope.auth.white_ip.length>0){
                        for(var i=0;i<$scope.auth.white_ip.length;i++){
                            if($scope.delName==$scope.auth.white_ip[i]){
                                $scope.auth.white_ip.splice(i,1);
                                blockName={white_ip:$scope.auth.white_ip};
                            }
                        }
                    }
                    if($scope.auth.black_ip.length>0){
                        for(var i=0;i<$scope.auth.black_ip.length;i++){
                            if($scope.delName==$scope.auth.black_ip[i]){
                                $scope.auth.black_ip.splice(i,1);
                                blockName={black_ip:$scope.auth.black_ip};
                            }
                        }
                    }
                    if($scope.auth.black_mac.length>0){
                        for(var i=0;i<$scope.auth.black_mac.length;i++){
                            if($scope.delName==$scope.auth.black_mac[i]){
                                $scope.auth.black_mac.splice(i,1);
                                blockName={black_mac:$scope.auth.black_mac};
                            }
                        }
                    }
                    if($scope.auth.white_mac.length>0){
                        for(var i=0;i<$scope.auth.white_mac.length;i++){
                            if($scope.delName==$scope.auth.white_mac[i]){
                                $scope.auth.white_mac.splice(i,1);
                                blockName={white_mac:$scope.auth.white_mac};
                            }
                        }
                    }
                    if($scope.auth.white_ips.length>0){
                        for(var i=0;i<$scope.auth.white_ips.length;i++){
                            if($scope.delName==$scope.auth.white_ips[i]){
                                $scope.auth.white_ips.splice(i,1);
                                blockName={white_ips:$scope.auth.white_ips};
                            }
                        }
                    }

                    if($scope.auth.black_ips.length>0){
                        for(var i=0;i<$scope.auth.black_ips.length;i++){
                            if($scope.delName==$scope.auth.black_ips[i]){
                                $scope.auth.black_ips.splice(i,1);
                                blockName={black_ips:$scope.auth.black_ips};
                            }
                        }
                    }
                    if($scope.auth.white_ipmark.length>0){
                        for(var i=0;i<$scope.auth.white_ipmark.length;i++){
                            if($scope.delName==$scope.auth.white_ipmark[i]){
                                $scope.auth.white_ipmark.splice(i,1);
                                blockName={white_ipmark:$scope.auth.white_ipmark};
                            }
                        }
                    }

                    if($scope.auth.black_ipmark.length>0){
                        for(var i=0;i<$scope.auth.black_ipmark.length;i++){
                            if($scope.delName==$scope.auth.black_ipmark[i]){
                                $scope.auth.black_ipmark.splice(i,1);
                                blockName={black_ipmark:$scope.auth.black_ipmark};
                            }
                        }
                    }
                    if($scope.auth.white_vlan.length>0){
                        for(var i=0;i<$scope.auth.white_vlan.length;i++){
                            if($scope.delName==$scope.auth.white_vlan[i]){
                                $scope.auth.white_vlan.splice(i,1);
                                blockName={white_vlan:$scope.auth.white_vlan};
                            }
                        }
                    }
                    if($scope.auth.white_vlans.length>0){
                        for(var i=0;i<$scope.auth.white_vlans.length;i++){
                            if($scope.delName==$scope.auth.white_vlans[i]){
                                $scope.auth.white_vlans.splice(i,1);
                                blockName={white_vlans:$scope.auth.white_vlans};
                            }
                        }
                    }
                    for(var i=0;i<$scope.gridDataArr.length;i++){
                        if($scope.gridDataArr[i].name==$scope.delName){
                            $scope.gridDataArr.splice(i,1);
                            $("#save_sign").attr("style","display:inline;color:red;margin-left:5px");
                            getGridData();
                        }
                    }
                    $scope.limitWebAuth_session();
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    //在线用户列表
    $scope.userTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "userTab",
        isAutoResized: false,
        columns: [{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "MAC地址",
            name: "mac"
        },{
            caption: "已用时长(秒)",
            name: "useTime"
        },{
            caption: "可用时长",
            name: "allowTime"
        },{
            caption: "实名信息",
            name: "realMsg"
        },{
            caption: "认证方式",
            name: "authType"
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration= $('<span class="btn btn-danger">踢下线</span>').data(rowData);
                opration[0].onclick = function(){
                    Showbo.Msg.confirm('确认将该用户踢下线吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            rcms.ajax({
                                type: 'post',
                                url: '/apis/conf/kick_auth/',
                                data:JSON.stringify({mac:rowData.mac,ip:rowData.ip})
                            }).success(function (data) {
                                if(data.result=='ok'){
                                    var webAuthData = $scope.userTab.gridData;
                                    for(var i=0;i<webAuthData.length;i++){
                                        if(webAuthData[i].mac==rowData.mac&&webAuthData[i].ip==rowData.ip){
                                            $scope.userTab.gridData.splice(i,1);
                                            $scope.userTab.update($scope.search_onlineUser($scope.userTab.gridData));
                                            break;
                                        }
                                    }
                                }else{
                                    rcms.message(data.msg);
                                }
                            }).error(function(data){
                                //rcms.message(data.msg);
                            });
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    //save上网认证
    $scope.authnetwork=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "authnetwork",
        isAutoResized: false,
        columns: [{
            caption: "<input id='all_check' type='checkbox'>",
            name: " ",
            formater:function(rowIndex, value, rowData){
                var input='';
                var check_interface=false;
                var num;
                for(var i=0;i<$scope.auth.interface.length;i++){
                    if($scope.auth.interface[i]==rowData.name){//原本已经选择
                        check_interface=true;
                        num=i;
                    }
                }
                if(check_interface==true){
                    var input= $('<input type="checkbox" id="'+rowData.name+'_checkbox" value="'+rowData.name+'" checked>').data(rowData);
                }else{
                    var input= $('<input type="checkbox" id="'+rowData.name+'_checkbox" value="'+rowData.name+'">').data(rowData);
                }
                input[0].onclick = function(){
                    if(check_interface==true){//删除那个认证网络
                        $scope.auth.interface.splice(num,1);
                        $("#all_check").attr("checked",false);//全选checkbox取消
                    }else{
                        $scope.auth.interface.push(rowData.name);
                        if($scope.auth.interface.length==$scope.auth.brides.length){//都选情况
                            $("#all_check").attr("checked",true);
                        }
                    }

                };
                return input;
            },
            width: 35
        },{
            caption: "名称",
            name: "name",
            formater:function(rowIndex, value, rowData){
                var option='';
                if($scope.auth.mode=='bridge'){
                    if(value.indexOf("vbr")!==-1){
                        option=value.replace("vbr","VLAN ");
                    }else{
                        if(value=='br0'){
                            option='网桥1';
                        }else if(value=='br1'){
                            option='网桥2';
                        }else if(value=='br2'){
                            option='网桥3';
                        }
                    }
                }else if($scope.auth.mode=='gateway'){
                    if(value.indexOf("vbr")!==-1){
                        option=value.replace("vbr","VLAN ");
                    }else{
                        option='LAN'+(parseFloat(value.split('br')[1])+1).toString();
                    }
                }else if($scope.auth.mode=='bypass'){
                    if(value.indexOf("vbr")!==-1){
                        option=value.replace("vbr","监控口 ");
                    }else{
                        option='监控口'+(parseFloat(value.split('br')[1])+1).toString();
                    }
                }
                return option;
            }
        },{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "子网掩码",
            name: "mask"
        }],
        isPage: true,
        isScroll: false,
        isMulti:false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    //save上网认证
    $scope.saveWebAuth=function(block){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({auth:block})
        }).success(function (data) {
            if(data.result=='ok'){
                for(var i=0;i<$scope.gridDataArr.length;i++){
                    if($scope.gridDataArr[i].name==$scope.delName){
                        $scope.gridDataArr.splice(i,1);
                        getGridData();
                    }
                }
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            //rcms.message(data.msg);
        })
    };

    function ips_endip(ips_mark) {
        var temp=ips_mark.split('/');
        var iparray=temp[0].split('.');
        var num=32-temp[1];
        var change;
        if(num<=8){
            var change=Math.pow(2,num);
            iparray[3]=change-1;
        }else if(num>8 && num<=16){
            iparray[3]=255;
            var change=Math.pow(2,num-8)-1;
            iparray[2]=change;
        }else if(num>16 && num<24){
            iparray[3]=255;
            iparray[2]=255;
            var change=Math.pow(2,num-16)-1;
            iparray[2]=change;
        }else{
            iparray[3]=255;
            iparray[2]=255;
            iparray[1]=255;
            var change=Math.pow(2,num-24)-1;
            iparray[0]=change;
        }
        return iparray[0] + "." + iparray[1] + "." + iparray[2] + "." + iparray[3];
    }
    function check_ips(ip1_start,ip1_end,ip2_start,ip2_end) {
        var ip_s,ip_e;
        var ip1_s=Util.ipToLong(ip1_start);
        var ip1_e=Util.ipToLong(ip1_end);
        var ip2_s=Util.ipToLong(ip2_start);
        var ip2_e=Util.ipToLong(ip2_end);
        if((ip1_e-ip1_s)>=(ip2_e-ip2_s)){//判断哪个区间比较大
            if((ip2_e>=ip1_s)&&(ip2_e<=ip1_e)||(ip2_s>=ip1_s)&&(ip2_s<=ip1_e)){
                return false;
            }
        }else{
            if((ip1_e>=ip2_s)&&(ip1_e<=ip2_e)||(ip1_s>=ip2_s)&&(ip1_s<=ip2_e)){
                return false;
            }
        }
        return true;
    }
    function checkValue(value,type,value2,type2) {
        var ipArray,ip, j,ip2,ipArray2,k;
        ip = value;
        ip2 = value2;
        if(type=='mac'){
            var reg1 = /^[A-Fa-f0-9]{1,2}\-[A-Fa-f0-9]{1,2}\-[A-Fa-f0-9]{1,2}\-[A-Fa-f0-9]{1,2}\-[A-Fa-f0-9]{1,2}\-[A-Fa-f0-9]{1,2}$/;
            var reg2 = /^[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}\:[A-Fa-f0-9]{1,2}$/;
            if (reg1.test(value)) {
                return true;
            } else if (reg2.test(value)) {
                return true;
            } else {
                Showbo.Msg.alert("不是正确的MAC。");
                return false;
            }
        }else if(type=='domain'){
            ipArray = ip.split(".");
            j = ipArray.length;
            if (ip.indexOf(" ")>=0){
                ip = ip.replace(/ /g,"");
                value = ip;
            }
            if (ip.toLowerCase().indexOf("http://")==0){
                ip = ip.slice(7);
                value = ip;
            }
            if(/^([\w-]+\.)+((com)|(net)|(org)|(gov\.cn)|(info)|(cc)|(com\.cn)|(net\.cn)|(org\.cn)|(name)|(biz)|(tv)|(cn)|(mobi)|(name)|(sh)|(ac)|(io)|(tw)|(com\.tw)|(hk)|(com\.hk)|(ws)|(travel)|(us)|(tm)|(la)|(me\.uk)|(org\.uk)|(ltd\.uk)|(plc\.uk)|(in)|(eu)|(it)|(jp))$/.test(ip) || ip_re.test(ip)){
                return true;
            }else{
                Showbo.Msg.alert("不是正确的域名");
                return false;
            }
        }else if(type=='ip'){
            if(!ip_re.test(ip)){
                Showbo.Msg.alert("不是正确的IP");
                     return false;
            }
            if($scope.auth.white_ips){
                for(var i=0;i<$scope.auth.white_ips.length;i++){//判断是否在网段中(起止方式)
                    if(ValidateRules.ipBetween(ip,$scope.auth.white_ips[i][0],$scope.auth.white_ips[i][1],true)){
                        Showbo.Msg.alert('与 '+$scope.auth.white_ips[i][0]+'到'+$scope.auth.white_ips[i][1]+' 冲突');
                        return false;
                    }
                }
            }
            if($scope.auth.black_ips){
                for(var i=0;i<$scope.auth.black_ips.length;i++){//判断是否在网段中(起止方式)
                    if(ValidateRules.ipBetween(ip,$scope.auth.black_ips[i][0],$scope.auth.black_ips[i][1],true)){
                        Showbo.Msg.alert('与 '+$scope.auth.black_ips[i][0]+'到'+$scope.auth.black_ips[i][1]+' 冲突');
                        return false;
                    }
                }
            }
            if($scope.auth.white_ipmark){
                for(var i=0;i<$scope.auth.white_ipmark.length;i++) {//判断是否在网段中(掩码方式)
                    temp = $scope.auth.white_ipmark[i].split('/');
                    var mask = Util.getBitToMask(temp[1]);
                    var ips = Util.getNetCode(ip, mask);
                    if (ips == temp[0]) {
                        Showbo.Msg.alert('与 '+$scope.auth.white_ipmark[i]+' 冲突');
                        return false;
                    }
                }
            }
            if($scope.auth.black_ipmark){
                for(var i=0;i<$scope.auth.black_ipmark.length;i++){//判断是否在网段中(掩码方式)
                    temp = $scope.auth.black_ipmark[i].split('/');
                    var mask = Util.getBitToMask(temp[1]);
                    var ips = Util.getNetCode(ip, mask);
                    if (ips == temp[0]) {
                        Showbo.Msg.alert('与 '+$scope.auth.black_ipmark[i]+' 冲突');
                        return false;
                    }
                }
            }
            return true;
        }else if(type=='ips'){
            if(type2){//起止方式
                ipArray = ip.split(".");
                if(!ip_re.test(ip)||!ip_re.test(ip2)){
                    Showbo.Msg.alert("不是正确的IP");
                    return false;
                }
                var ipResult = ValidateRules.inSameNet(ip,ip2,'255.255.255.0');
                if(!ipResult){
                    Showbo.Msg.alert('两个ip不在一个网段内');
                    return false;
                }
                ipArray2 = ip2.split(".");
                if(parseInt(ipArray[3])>=parseInt(ipArray2[3])){
                    Showbo.Msg.alert('开始地址必须小于结束地址');
                    return false;
                }
                for(var i=0;i<$scope.auth.white_ip.length;i++){//判断该网段内是否有IP已经被设置
                    if(ValidateRules.ipBetween($scope.auth.white_ip[i],ip,ip2,true)){
                        Showbo.Msg.alert('与 '+$scope.auth.white_ip[i]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.black_ip.length;i++){
                    if(ValidateRules.ipBetween($scope.auth.black_ip[i],ip,ip2,true)){
                        Showbo.Msg.alert('与 '+$scope.auth.black_ip[i]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.white_ipmark.length;i++) {//判断该网段是否与其他网段重复(掩码方式的网段)
                    temp = $scope.auth.white_ipmark[i].split('/');
                    if (!check_ips(ip,ip2,temp[0],ips_endip($scope.auth.white_ipmark[i]))) {
                        Showbo.Msg.alert('与 '+$scope.auth.white_ipmark[i]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.black_ipmark.length;i++){
                    temp = $scope.auth.black_ipmark[i].split('/');
                    if (!check_ips(ip,ip2,temp[0],ips_endip($scope.auth.black_ipmark[i]))) {
                        Showbo.Msg.alert('与 '+$scope.auth.black_ipmark[i]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.black_ips.length;i++){//判断该网段是否与其他网段重复(起止方式的网段)
                    if (!check_ips(ip,ip2,$scope.auth.black_ips[i][0],$scope.auth.black_ips[i][1])) {
                        Showbo.Msg.alert('与 '+$scope.auth.black_ips[i][0]+'到'+$scope.auth.black_ips[i][1]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.white_ips.length;i++){//判断该网段是否与其他网段重复(起止方式的网段)
                    if (!check_ips(ip,ip2,$scope.auth.white_ips[i][0],$scope.auth.white_ips[i][1])) {
                        Showbo.Msg.alert('与 '+$scope.auth.white_ips[i][0]+'到'+$scope.auth.white_ips[i][1]+' 冲突');
                        return false;
                    }
                }
            }else{//掩码方式
                 if(!ips_re.test(ip)){
                     Showbo.Msg.alert("网段地址不正确");
                    return false;
                }
                ipArray = ip.split('/');
                var mask = Util.getBitToMask(ipArray[1]);
                var ips = Util.getNetCode(ipArray[0],mask);
                if(ipArray[0]!==ips){
                    Showbo.Msg.alert('网段地址不正确');
                    return false;
                }
                for(var i=0;i<$scope.auth.white_ip.length;i++){//判断该网段内是否有IP已经被设置
                    if (Util.getNetCode($scope.auth.white_ip[i], mask) == ipArray[0]) {
                        Showbo.Msg.alert('与 '+$scope.auth.white_ip[i]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.black_ip.length;i++){
                    if (Util.getNetCode($scope.auth.black_ip[i], mask) == ipArray[0]) {
                        Showbo.Msg.alert('与 '+$scope.auth.black_ip[i]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.white_ipmark.length;i++) {//判断该网段是否与其他网段重复(掩码方式的网段)
                    temp = $scope.auth.white_ipmark[i].split('/');
                    if (!check_ips(ipArray[0],ips_endip(ip),temp[0],ips_endip($scope.auth.white_ipmark[i]))) {
                        Showbo.Msg.alert('与 '+$scope.auth.white_ipmark[i]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.black_ipmark.length;i++){
                    temp = $scope.auth.black_ipmark[i].split('/');
                    if (!check_ips(ipArray[0],ips_endip(ip),temp[0],ips_endip($scope.auth.black_ipmark[i]))) {
                        Showbo.Msg.alert('与 '+$scope.auth.black_ipmark[i]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.black_ips.length;i++){//判断该网段是否与其他网段重复(起止方式的网段)
                    if (!check_ips(ipArray[0],ips_endip(ip),$scope.auth.black_ips[i][0],$scope.auth.black_ips[i][1])) {
                        Showbo.Msg.alert('与 '+$scope.auth.white_ips[i][0]+'到'+$scope.auth.white_ips[i][1]+' 冲突');
                        return false;
                    }
                }
                for(var i=0;i<$scope.auth.white_ips.length;i++){//判断该网段是否与其他网段重复(起止方式的网段)
                    if (!check_ips(ipArray[0],ips_endip(ip),$scope.auth.white_ips[i][0],$scope.auth.white_ips[i][1])) {
                        Showbo.Msg.alert('与 '+$scope.auth.white_ips[i][0]+'到'+$scope.auth.white_ips[i][1]+' 冲突');
                        return false;
                    }
                }
            }
            return true;
        }else{
            ipArray = ip.split(".");
            j = ipArray.length;
            if (ip.indexOf(" ")>=0){
                ip = ip.replace(/ /g,"");
                value = ip;
            }
            if (ip.toLowerCase().indexOf("http://")==0){
                ip = ip.slice(7);
                value = ip;
            }
            if(!/^([\w-]+\.)+((com)|(net)|(org)|(gov\.cn)|(info)|(cc)|(com\.cn)|(net\.cn)|(org\.cn)|(name)|(biz)|(tv)|(cn)|(mobi)|(name)|(sh)|(ac)|(io)|(tw)|(com\.tw)|(hk)|(com\.hk)|(ws)|(travel)|(us)|(tm)|(la)|(me\.uk)|(org\.uk)|(ltd\.uk)|(plc\.uk)|(in)|(eu)|(it)|(jp))$/.test(ip)&&j!=4){
                return false;
            }else if(j==4){
                for(var i=0;i<4;i++)
                {
                    if(ipArray[i].length==0 || ipArray[i]>255)
                    {
                        return false;
                    }
                }
            }
            return true;
        }
    }
    $('#authnetwork_btn').on('click',function(){
        window.sessionStorage.auth=JSON.stringify($scope.auth);
        $scope.get_authnetwork();
        $('#authnetwork_dialog').modal('hide');
    });
    $scope.search_onlineUser=function (data) {
        var search_data=[];
        if(onlineUser_key==""){
            return data;
        }else{
            for(var i=0;i<data.length;i++){
                if(data[i].ip.indexOf(onlineUser_key)>=0 || data[i].mac.indexOf(onlineUser_key)>=0){
                    search_data.push(data[i]);
                }
            }
            return search_data;
        }
    };
    $("#search").on('click',function(){
        onlineUser_key=$("#online_search").val();
        $scope.get_onlineUse();
    });
    $('#authnetwork_cancel').on('click',function(){//取消设置认证网络，数据还原
        $scope.auth.interface=(JSON.parse(window.sessionStorage.auth)).interface;
    });
    $('#authnetwork_edit').on('click',function(){
        $scope.authnetwork.update($scope.auth.brides);
        $('#authnetwork_dialog').modal('show');
        if($scope.auth.interface.length==$scope.auth.brides.length){
            $("#all_check").attr("checked",true);//都选情况
        }else{
            $("#all_check").attr("checked",false);
        }
    });
    $('#setChange').on('click',function(){
        $("#wait_dialog").modal("show");
        var authStr={};
        authStr.black_domain=$scope.auth.black_domain;
        authStr.black_ip=$scope.auth.black_ip;
        authStr.black_mac=$scope.auth.black_mac;
        authStr.black_ips=$scope.auth.black_ips;
        authStr.black_ipmark=$scope.auth.black_ipmark;

        authStr.white_domain=$scope.auth.white_domain;
        authStr.white_ip=$scope.auth.white_ip;
        authStr.white_mac=$scope.auth.white_mac;
        authStr.white_ips=$scope.auth.white_ips;
        authStr.white_ipmark=$scope.auth.white_ipmark;
        authStr.white_vlan=$scope.auth.white_vlan;
        authStr.white_vlans=$scope.auth.white_vlans;

        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({auth:authStr})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                $("#save_sign").attr("style","display:none");
                rcms.message('配置成功!');
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        });
    });
    $('#addBlock').on('click',function(){
        $scope.auth=$scope.auth?$scope.auth:{};
        if($('#nameType').val()=='ip'){
            var result = checkValue($('#inputipLimit').val(),$('#nameType').val());
            if(!result){
                return false;
            }
        }else if($('#nameType').val()=='mac'){
            var result = checkValue($('#inputmacLimit').val(),$('#nameType').val());
            if(!result){
                return false;
            }
        }else if($('#nameType').val()=='domain'){
            var result = checkValue($('#inputdomainLimit').val(),$('#nameType').val());
            if(!result){
                return false;
            }
        }else if($('#nameType').val()=='ips'){
            if($('#ipsType').val()=='ipmark'){
                var result = checkValue($('#inputipmarkLimit').val(),$('#nameType').val());
                if(!result){
                    return false;
                }
            }else{
                var result = checkValue($('#inputipLimit').val(),$('#nameType').val(),$('#inputLimit2').val(),$('#ipsType').val());
                if(!result){
                    return false;
                }
            }
        }else if($('#nameType').val()=='vlan'){
            if($('#blockType').val()=='black'){
                Showbo.Msg.alert('暂不支持VLAN的黑名单设置');
                return false
            }
            var result = parseInt($('#inputVlanLimit').val())>0?(parseInt($('#inputVlanLimit').val())<4094?true:false):false;
            if(!result){
                Showbo.Msg.alert('输入范围不正确');
                return false;
            }
        }else if($('#nameType').val()=='vlans'){
            if($('#blockType').val()=='black'){
                Showbo.Msg.alert('暂不支持VLAN的黑名单设置');
                return false
            }
            var result = parseInt($('#inputVlanLimit').val())>0?(parseInt($('#inputVlanLimit').val())<4094?true:false):false;
            var result2 = parseInt($('#inputVlanLimit2').val())>0?(parseInt($('#inputVlanLimit2').val())<4094?true:false):false;
            var result3 = parseInt($('#inputVlanLimit2').val())>parseInt($('#inputVlanLimit').val())?true:false;
            if((!result)||(!result2)||(!result3)){
                Showbo.Msg.alert('输入范围不正确');
                return false;
            }
        }
        var blockName = '';
        for(var i=0;i<$scope.blockNameSelect.length;i++){
            if($('#nameType').val()==$scope.blockNameSelect[i].type&&$('#blockType').val()==$scope.blockNameSelect[i].mode){
                if($('#nameType').val()=='ips'){
                    blockName=$('#blockType').val()+'_'+$('#ipsType').val();
                }else{
                    blockName = $scope.blockNameSelect[i].name;
                }
            }
        }
        var inputValue;
        var Type_name;
        if($('#nameType').val()=='ip'){
            inputValue=$('#inputipLimit').val();
            Type_name="IP地址";
        }else if($('#nameType').val()=='mac'){
            inputValue=$('#inputmacLimit').val()+','+($('#webAuthName').val()?$('#webAuthName').val():'null');
            Type_name="MAC地址";
        }else if($('#nameType').val()=='domain'){
            inputValue=$('#inputdomainLimit').val();
            Type_name="域名";
        }else if($('#nameType').val()=='vlan'){
            Type_name="VLANID";
            inputValue=$('#inputVlanLimit').val();
        }else if($('#nameType').val()=='vlans'){
            Type_name="VLANID范围";
            inputValue=[$('#inputVlanLimit').val(),$('#inputVlanLimit2').val()];
        }else if($('#nameType').val()=='ips'){
            Type_name="IP网段";
            if($('#ipsType').val()=='ipmark'){
                inputValue=$('#inputipmarkLimit').val();
            }else{
                inputValue=$('#inputipLimit').val()+','+$('#inputLimit2').val();
            }
        }
        var  Type_block;
        for(var j=0;j<$scope.gridDataArr.length;j++){//相等
            if($('#nameType').val()=='mac'){
                if($scope.gridDataArr[j].name.toString().split(",")[0]==inputValue.toString().split(",")[0]){
                    if($scope.gridDataArr[j].block=="white"){
                        Type_block="白名单";
                    }else{
                        Type_block="黑名单";
                    }
                    Showbo.Msg.alert("该"+Type_name+"已在"+Type_block+"中");
                    return false;
                }
            }
            else{
                if($scope.gridDataArr[j].name.toString()== inputValue.toString()){
                    if($scope.gridDataArr[j].block=="white"){
                        Type_block="白名单";
                    }else{
                        Type_block="黑名单";
                    }
                    Showbo.Msg.alert("该"+Type_name+"已在"+Type_block+"中");
                    return false;
                }
            }

        }
        $scope.auth[blockName].push(inputValue);
        $scope.gridDataArr.push({name:inputValue,type:$('#nameType').val(),block:$('#blockType').val()});
        window.sessionStorage.auth=JSON.stringify($scope.auth);
        // alert("添加成功");
        $("#save_sign").attr("style","display:inline;color:red;margin-left:5px");
        getGridData();
    });
    $('#webAuthFormSub').submit(function(e){
        var num_re=/^\d+$/;
        var data = $(this).serializeArray();
        var dataArr={};
        for (var i = 0; i < data.length; i++) {
            dataArr[data[i].name] = data[i].value;
        }
        dataArr.wxwifi=$scope.auth.wxwifi;
        dataArr.wx_escape=$scope.auth.wx_escape;
        if($('#div1')[0].className=='open1'){//上网认证开关开启后，微信连wifi开关修改才生效
            dataArr.enable = '1';
            if($('#div3')[0].className=='open1'){
                dataArr.wxwifi = '1';
                if($scope.auth.wx_escape=='1'){//微信连WIFI开关开启后，认证逃生开关修改才生效
                    dataArr.wx_escape = '1';
                }else{
                    dataArr.wx_escape = '0';
                }
            }else{
                dataArr.wxwifi = '0';
            }
            if($('#div7')[0].className=='open1'){
                dataArr.macbypass = '1';
            }else{
                dataArr.macbypass = '0';
            }
            if($('#div9')[0].className=='open1'){
                dataArr.wd_escape = '1';
            }else{
                dataArr.wd_escape = '0';
            }
        }else{
            dataArr.enable = '0';
        }
        // if(dataArr.wx_escape=="0"){//认证逃生开关关闭,开关内数据还原
        //     dataArr.userescape_time=$scope.auth.userescape_time;
        //     dataArr.wxerr_rangetime=$scope.auth.wxerr_rangetime;
        //     dataArr.wxerr_count=$scope.auth.wxerr_count;
        //     dataArr.wxerr_restime=$scope.auth.wxerr_restime;
        //     dataArr.wmc_alivetime=$scope.auth.wmc_alivetime;
        // }
        // if(dataArr.wxwifi=='0'){
            dataArr.userescape_time=$scope.auth.userescape_time;
            dataArr.wxerr_rangetime=$scope.auth.wxerr_rangetime;
            dataArr.wxerr_count=$scope.auth.wxerr_count;
            dataArr.wxerr_restime=$scope.auth.wxerr_restime;
            dataArr.wmc_alivetime=$scope.auth.wmc_alivetime;
        // }
        if(dataArr.enable=="1"){//上网认证开关开启,数据更新
            var result = checkValue($('#auth_server').val());
            dataArr.port=dataArr.port?dataArr.port:"80";
            if(!(parseInt(dataArr.port)>=0)||!(parseInt(dataArr.port)<65535)|| !(num_re.test(dataArr.port))){
                Showbo.Msg.alert('端口号输入不正确,范围为：大于0且小于65535');
                return false;
            }
            if(!(parseInt(dataArr.auth_timeout)>=0)||!(parseInt(dataArr.auth_timeout)<1440) || !(num_re.test(dataArr.auth_timeout))){
                Showbo.Msg.alert('可上网时长输入不正确,范围为：大于等于0且小于1440');
                return false;
            }
            if(!result){
                Showbo.Msg.alert('服务器地址输入不正确');
                return false;
            }
            var reg = /^\s*(\S+)\s*$/;
            if(!dataArr.ssid||!reg.test(dataArr.ssid)){
                Showbo.Msg.alert('认证SSID不能为空，且不能为为空格');
                return false;
            }
            if(!(parseInt(dataArr.userescape_time)>1)||!(parseInt(dataArr.userescape_time)<86400)|| !(num_re.test(dataArr.userescape_time))){
                Showbo.Msg.alert('用户逃生时间输入不正确,范围为：大于1且小于86400');
                return false;
            } if(!(parseInt(dataArr.wxerr_rangetime)>1)||!(parseInt(dataArr.wxerr_rangetime)<86400)|| !(num_re.test(dataArr.wxerr_rangetime))){
                Showbo.Msg.alert('逃生超时时间输入不正确,范围为：大于1且小于86400');
                return false;
            }
            if(!/^[1-9]$/.test(dataArr.wxerr_count)){
                Showbo.Msg.alert('连续认证超时用户数输入不正确,范围为：大于等于1且小于10');
                return false;
            }
            if(!(parseInt(dataArr.wxerr_restime)>1)||!(parseInt(dataArr.wxerr_restime)<86400)|| !(num_re.test(dataArr.wxerr_restime))){
                Showbo.Msg.alert('集体逃生后时间值输入不正确,范围为：大于1且小于86400');
                return false;
            }
            if(!(parseInt(dataArr.wmc_alivetime)>=0)||!(parseInt(dataArr.wmc_alivetime)<86400)|| !(num_re.test(dataArr.wmc_alivetime))){
                Showbo.Msg.alert('认证检测时间输入不正确,范围为：大于等于0且小于86400');
                return false;
            }
            dataArr.interface=$scope.auth.interface;
            if(dataArr.interface.length=="0"){
                Showbo.Msg.alert('认证网络不能为空');
                return false;
            }
        }else{
            $scope.auth.interface=JSON.parse(window.sessionStorage.interface);//认证网络也必须还原
        }
        $("#wait_dialog").modal("show");
        var count=0;
        function output_number() {
            count++;
            if(count==30){
                $("#wait_dialog").modal("hide");
                clearInterval(timer);
            }
        }
        timer=setInterval(function() {output_number();}, 1000);
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({auth:dataArr})
        }).success(function (data) {
            if(data.result=='ok'){
                rcms.message('配置成功!');
                $scope.initWebAuth();
                $("#wait_dialog").modal("hide");
                clearInterval(timer);
            }else{
                rcms.message(data.msg);
                $("#wait_dialog").modal("hide");
                clearInterval(timer);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            clearInterval(timer);
            //rcms.message(data.msg);
        });

    });
    $("#webAuth").submit(function () {
        if($('#div5')[0].className=='open1'){//上网认证开关开启后，微信连wifi开关修改才生效
            $scope.auth.wx_escape="1";
        }else {
            $scope.auth.wx_escape="0";
        }
        $scope.auth.userescape_time=$('#userescape_time').val();
        $scope.auth.wxerr_rangetime=$('#wxerr_rangetime').val();
        $scope.auth.wxerr_count=$('#wxerr_count').val();
        $scope.auth.wxerr_restime=$('#wxerr_restime').val();
        $scope.auth.wmc_alivetime=$('#wmc_alivetime').val();
        $("#webAuth_dialog").modal('hide');
    });
    var getGridData=function(){
        var dataArr = [];
        if($scope.gridDataArr.length>0){
            if($('#nameTypeSelect').val()=='none'){
                if($('#blockTypeSelect').val()=='none'){
                    dataArr=$scope.gridDataArr;
                }else{
                    for(var i=0;i<$scope.gridDataArr.length;i++){
                        if($('#blockTypeSelect').val()==$scope.gridDataArr[i].block){
                            dataArr.push($scope.gridDataArr[i]);
                        }
                    }
                }
            }else{
                if($('#blockTypeSelect').val()=='none'){
                    for(var i=0;i<$scope.gridDataArr.length;i++){
                        if($('#nameTypeSelect').val()==$scope.gridDataArr[i].type){
                            dataArr.push($scope.gridDataArr[i]);
                        }
                    }
                }else{
                    for(var i=0;i<$scope.gridDataArr.length;i++){
                        if($('#nameTypeSelect').val()==$scope.gridDataArr[i].type&&$('#blockTypeSelect').val()==$scope.gridDataArr[i].block){
                            dataArr.push($scope.gridDataArr[i]);
                        }
                    }
                }
            }
        }
        $scope.blockTypeTab.update(dataArr);
    };
    $('#nameTypeSelect,#blockTypeSelect').on('change',function(){
        getGridData();
    });
    $('#nameType').on('change',function(){
        if($('#nameType').val()=='ips'){
            $('#ipsType').show();
            if($('#ipsType').val()=='ips'){
                $('#inputipLimit,#ipArrLink,#inputLimit2').show();
                $('#inputipmarkLimit,#inputmacLimit,#inputdomainLimit,#webAuthName,#webAuthUser,#inputVlanLimit,#inputVlanLimit2,#vlanArrLink').hide();
            }else{
                $('#inputipmarkLimit').show();
                $('#inputipLimit,#ipArrLink,#inputLimit2,#inputmacLimit,#inputdomainLimit,#webAuthName,#webAuthUser,#inputVlanLimit,#inputVlanLimit2,#vlanArrLink').hide();
            }
        }else if($('#nameType').val()=='ip'){
            $('#inputipLimit').show();
            $('#ipsType,#inputipmarkLimit,#ipArrLink,#inputLimit2,#inputmacLimit,#inputdomainLimit,#webAuthName,#webAuthUser,#inputVlanLimit,#inputVlanLimit2,#vlanArrLink').hide();
        }else if($('#nameType').val()=='mac'){
            $('#inputmacLimit,#webAuthName,#webAuthUser').show();
            $('#ipsType,#inputipmarkLimit,#ipArrLink,#inputLimit2,#inputipLimit,#inputdomainLimit,#inputVlanLimit,#inputVlanLimit2,#vlanArrLink').hide();
        }else if($('#nameType').val()=='domain'){
            $('#inputdomainLimit').show();
            $('#ipsType,#inputipmarkLimit,#ipArrLink,#inputLimit2,#inputipLimit,#inputmacLimit,#webAuthName,#webAuthUser,#inputVlanLimit,#inputVlanLimit2,#vlanArrLink').hide();
        }else if($('#nameType').val()=='vlan'){
            $('#inputVlanLimit').show();
            $('#ipsType,#inputipmarkLimit,#ipArrLink,#inputLimit2,#inputipLimit,#inputmacLimit,#webAuthName,#webAuthUser,#inputdomainLimit,#inputVlanLimit2,#vlanArrLink').hide();
        }else if($('#nameType').val()=='vlans'){
            $('#inputVlanLimit,#inputVlanLimit2,#vlanArrLink').show();
            $('#ipsType,#inputipmarkLimit,#ipArrLink,#inputLimit2,#inputipLimit,#inputmacLimit,#webAuthName,#inputdomainLimit,#webAuthUser').hide();
        }
    });
    $('#ipsType').on('change',function(){
        if($('#ipsType').val()=='ips'){
            $('#inputipLimit,#ipArrLink,#inputLimit2').show();
            $('#inputipmarkLimit,#inputmacLimit,#inputdomainLimit,#webAuthName,#webAuthUser,#inputVlanLimit,#inputVlanLimit2,#vlanArrLink').hide();
        }else{
            $('#inputipmarkLimit').show();
            $('#inputipLimit,#ipArrLink,#inputLimit2,#inputmacLimit,#inputdomainLimit,#webAuthName,#webAuthUser,#inputVlanLimit,#inputVlanLimit2,#vlanArrLink').hide();
        }
    });
    $('#all_check').on('click',function(){
        if(document.getElementById("all_check").checked){//全选
            $scope.auth.interface=[];
            for(var j=0;j<$scope.auth.brides.length;j++){
                $scope.auth.interface.push($scope.auth.brides[j].name);
            }
            $scope.authnetwork.update($scope.auth.brides);
        }else{//全部取消
            $scope.auth.interface=[];
            $scope.authnetwork.update($scope.auth.brides);
        }
    });
    $scope.blockNameSelect=[
        {name:'black_domain',type:'domain',mode:'black'},
        {name:'black_ip',type:'ip',mode:'black'},
        {name:'black_mac',type:'mac',mode:'black'},
        {name:'black_ips',type:'ips',mode:'black'},
        {name:'black_ipmark',type:'ipmark',mode:'black'},
        {name:'black_vlan',type:'vlan',mode:'black'},
        {name:'black_vlans',type:'vlans',mode:'black'},
        {name:'white_domain',type:'domain',mode:'white'},
        {name:'white_ip',type:'ip',mode:'white'},
        {name:'white_mac',type:'mac',mode:'white'},
        {name:'white_ips',type:'ips',mode:'white'},
        {name:'white_ipmark',type:'ipmark',mode:'white'},
        {name:'white_vlan',type:'vlan',mode:'white'},
        {name:'white_vlans',type:'vlans',mode:'white'}
    ]
});
myApp.controller('tracertSurf', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("hide");
    window.sessionStorage.pageUrl='';
    $scope.goingSurf = true;
    $('#tracertSelect').on('change',function(){
        $('#tracert_msg').html('');
        if($('#tracertSelect').val()=='ping'){
            $('#pageSet').show();
        }else{
            $('#pageSet').hide();
        }
        $scope.goingSurf = true;
    });
    $scope.getDiagnosis=function(dataSet){
        if(!$scope.goingSurf){
            $scope.goingSurf = true;
            return false;
        }
        $('#tracert_btn').val('正在检测···');
        $('#tracert_btn').attr('disabled','disabled');
        var hid=document.getElementById('msg_end');
        var mai=document.getElementById('main');
        $('#tracert_msg').html('');
        rcms.ajax({
            type: 'post',
            url: '/apis/diagnosis/diag/',
            data:JSON.stringify($scope.dataSet)
        }).success(function (data) {
            if(data.result=='ok'){
                $scope.dataSet.seq=1;
                var msgArr = data.msg.split('###');
                for(var i=0;i<msgArr.length;i++){
                    $('<span>'+msgArr[i]+'</span><br>').appendTo($('#tracert_msg'));
                    mai.scrollTop=mai.scrollHeight;
                }
                if(!data.is_end){
                    setTimeout(function(){
                        $scope.getDiagnosis($scope.dataSet)},2000);
                }else{
                    $('#tracert_btn').removeAttr('disabled');
                    $('#tracert_btn').val('开始检测');
                }
            }else{
                $('#tracert_msg').attr('style','color:red');
                $('#tracert_msg').html('<span style="color: red">检测失败</span>');
            }
        }).error(function (data) {
            $('#tracert_msg').html('<span style="color: red">检测失败</span>');
        })
    };
    $('#tracertForm').submit(function(e){
        var form = $(this);
        var data = form.serializeArray();
        var dataArr = {};
        for (var i = 0; i < data.length; i++) {
            dataArr[data[i].name] = data[i].value;
        }
        $scope.dataSet={};
        if($('#tracertSelect').val()=='ping'){
            if(parseInt(dataArr.count)>30||parseInt(dataArr.count)<1){
                Showbo.Msg.alert('封包数量范围应该设置在1~30');
                return false;
            }
            $scope.dataSet={diag:dataArr.diag,address:dataArr.address,count:dataArr.count,pack_size:dataArr.pack_size,seq:0}
        }else{
            $scope.dataSet={diag:dataArr.diag,address:dataArr.address,seq:0}
        }
        $scope.getDiagnosis($scope.dataSet);
    })
});
myApp.controller('snmpSurf', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/snmpSurf';
    $scope.sump_ip='';
    $scope.snmpTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "snmpTab",
        isAutoResized: false,
        columns: [{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "团体名",
            name: "community"
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary marginLeft10">终端列表</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.selectValue='';
                            $scope.terminalListTab.update(rowData.sta_status);
                            $scope.terminalListData=rowData.sta_status;
                        })
                    },10);
                    $('#terminalList_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除规则吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.snmpData.length;i++){
                                if($scope.snmpData[i].ip==rowData.ip){
                                    $scope.snmpData.splice(i,1);
                                    $scope.setSnmp($scope.snmpData);
                                }
                            }
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.terminalListTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "terminalListTab",
        isAutoResized: false,
        columns: [{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "MAC地址",
            name: "mac"
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.selectIp=function(){
        var leasesData=[];
        for(var i=0;i<$scope.terminalListData.length;i++){
            if($scope.terminalListData[i].ip.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.terminalListData[i]);
            }
        }
        $scope.terminalListTab.update(leasesData);
    };
    $scope.setSnmp = function(setSnmp){
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/set_snmp/',
            data:JSON.stringify({snmp:setSnmp})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result='ok'){
                rcms.message('设置成功');
                $scope.getSnmp();
            }else{
                Showbo.Msg.alert(data.msg);
                $scope.getSnmp();
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //alert(data.msg);
        })
    };
    $scope.getSnmp =function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/get_snmp/'
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                $scope.snmpData=[];
                if(data.msg.length>0){
                    for(var i=0;i<data.msg.length;i++){
                        $scope.snmpData[i]={ip:data.msg[i].ip,community:data.msg[i].community}
                    }
                }
                $scope.snmpTab.update(data.msg);
            }else{
                rcms.message(data.msg);
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
                //alert(data.msg);
        });
    };
    $scope.getSnmp();
    $scope.add_ip=function(){
        for(var i=0;i<$scope.snmpData.length;i++){
            if($scope.snmpData[i].ip==$scope.sump_ip){
                Showbo.Msg.alert('IP已存在，请重新输入');
                return false;
            }
        }
        $scope.snmpData.push({ip:$scope.sump_ip,community:$scope.sump_community});
        $scope.setSnmp($scope.snmpData);
    };
    $scope.delete_ip=function(){
        if ($scope.snmpTab.getSelectedRows().length <= 0) {
            alert("请选择要删除的配置项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中配置项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var service_id=$scope.snmpTab.getSelectedRows();
                for(var d=0;d<service_id.length;d++){
                    for(var i=0;i<$scope.snmpData.length;i++){
                        if($scope.snmpData[i].ip==service_id[d].ip){
                            $scope.snmpData.splice(i,1);
                        }
                    }
                }
                $scope.setSnmp($scope.snmpData);
            }
        })
    }
});
myApp.controller('interfaceSet', function ($scope, Data,$timeout) {
    $scope.moreDev=true;
    var ip_re = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/;
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/interfaceSet';
    var left_interface=[];
    $scope.saveChange=function(){
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/switch_lanwan/',
            data:JSON.stringify({lan_wan_sta:$scope.interface_info})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('修改成功');
                $scope.get_conf();
            }else{
                Showbo.Msg.alert(data.msg);
            }
        }).error(function(e){
            $("#wait_dialog").modal("hide");
        })
    };
    $scope.moreDevSet=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                if(!$scope.moreDev){
                    $scope.moreDev=true;
                }else{
                    $scope.moreDev=false;
                }
            })
        },10)
    };
    $scope.interfaceTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "interfaceTab",
        isAutoResized: false,
        columns: [{
            caption: "名称",
            name: "name",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='br0'){
                    option='网桥1';
                }else if(value=='br1'){
                    option='网桥2';
                }else if(value=='br2'){
                    option='网桥3';
                }
                return option;
            }
        },{
            caption: "VLAN透传",
            name: "vlan",
            formater:function(rowIndex, value, rowData){
                var option = '';
                if(rowData.vlan_switch=='0'){
                    option = $('<span>关闭</span><span style="color: #003bb3;cursor:pointer;display: none"><u>查看详情</u></span>').data(rowData);
                }else{
                    option = $('<span>开启</span><span style="color: #003bb3;cursor:pointer"><u>查看详情</u></span>').data(rowData);
                }
                option[1].onclick=function(){
                    $('#interfaceName').val(rowData.name);
                    $scope.vlanTable.update(rowData.vlan);
                    $('#vlan_dialog').modal('show');
                };
                return option;
            }
        },{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "子网掩码",
            name: "mask"
        },{
            caption: "绑定接口",
            name: "interface",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value){
                    for(var i=0;i<value.length;i++){
                        if(i==value.length-1){
                            option=option+value[i]
                        }else{
                            option=option+value[i]+'、'
                        }
                    }
                }
                return option;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(rowData.name=='br0'){
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger ban" style="margin-left: 10px">删除</span>').data(rowData);
                }else{
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                }
                opration[0].onclick = function(){
                    $('#errorMsg').hide();
                    $('#addOrNot').val('old');
                    $('#name').attr('disabled','disabled');
                    $('#name').val(rowData.name);
                    $('#ip').val(rowData.ip);
                    $('#mac').val(rowData.mac);
                    $('#mask').val(rowData.mask);
                    if(rowData.vlan_switch=='0'){
                        $('#vlan_TableForm').hide();
                        // $('#noVlan').show();
                        $('#div10')[0].className='close2';
                        $('#div9')[0].className='close1';
                        // $('#ip').removeProp('disabled');
                        // $('#mask').removeProp('disabled');
                    }else{
                        $('#vlan_TableForm').show();
                        // $('#noVlan').hide();
                        $('#div10')[0].className='open2';
                        $('#div9')[0].className='open1';
                        // $('#ip').prop('disabled',true);
                        // $('#mask').prop('disabled',true);
                    }
                    if(rowData.vlan&&rowData.vlan.length>0){
                        $scope.vlan_Table.update(rowData.vlan);
                    }else{
                        $scope.vlan_Table.update([]);
                    }
                    $('#interfaceZone').html('');
                    if(rowData.interface_all.length>0){
                        for(var k=0;k<rowData.interface_all.length;k++){
                            $('<label><input class="interfaceCheck" type="checkbox" name="'+rowData.interface_all[k]+'">'+rowData.interface_all[k]+'</label>').appendTo($('#interfaceZone'));
                        }
                    }
                    $('#interface_dialog').find('input[type=checkbox]').removeProp('checked');
                    if(rowData.interface&&rowData.interface.length>0){
                        for(var i=0;i<$('#interface_dialog').find('input[class=interfaceCheck]').length;i++){
                            for(var j=0;j<rowData.interface.length;j++){
                                if(rowData.interface[j]==$('#interface_dialog').find('input[class=interfaceCheck]')[i].name){
                                    $('#interface_dialog').find('input[name='+rowData.interface[j]+']').prop('checked',true);
                                }
                            }
                        }
                    }
                    $('#interface_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.network.bridges.length;i++){
                                if($scope.network.bridges[i].name==rowData.name){
                                    $scope.network.bridges.splice(i,1);
                                }
                            }
                            $scope.get_vlanIdArr();
                            $scope.left_interface();
                            window.sessionStorage.network=JSON.stringify($scope.network);
                            $scope.set_conf($scope.network.bridges);
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.gatewayLineData={};
    $scope.dhcpType=true;
    $scope.pppoeType=false;
    $scope.staticType=false;
    $scope.gatewayTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "gatewayTab",
        isAutoResized: false,
        columns: [{
            caption: "名称",
            name: "name",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value.indexOf('br')!=-1){
                    option='LAN'+(parseFloat(value.split('br')[1])+1).toString();
                }else{
                    option='WAN'+(parseFloat(value.split('eth')[1])+1).toString();
                }
                return option;
            }
        },{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "子网掩码",
            name: "mask"
        },{
            caption: "上网方式",
            name: "proto",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='static'){
                    option='静态配置'
                }else if(value=='pppoe'){
                    option='拨号上网'
                }else if(value=='dhcp'){
                    option='自动获取'
                }
                return option;
            }
        },{
            caption: "绑定接口",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(rowData.name.indexOf('eth')!=-1){
                    option=rowData.name;
                }else{
                    for(var i=0;i<rowData.interface.length;i++){
                        if(i==rowData.interface.length-1){
                            option=option+rowData.interface[i]
                        }else{
                            option=option+rowData.interface[i]+'、'
                        }
                    }
                }
                return option;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(rowData.name=='br0'||(rowData.name.indexOf('eth')!=-1)){
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger ban" style="margin-left: 10px">删除</span>').data(rowData);
                }else{
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                }
                opration[0].onclick = function(){
                    if(rowData.name.indexOf('br')!=-1){
                        $('#errorMsg').hide();
                        $('#addOrNot').val('old');
                        $('#name').attr('disabled','disabled');
                        $('#name').val(rowData.name);
                        $('#ip').val(rowData.ip);
                        $('#mac').val(rowData.mac);
                        $('#mask').val(rowData.mask);
                        if(rowData.vlan_switch=='0'){
                            $('#vlan_TableForm').hide();
                            // $('#noVlan').show();
                            $('#div10')[0].className='close2';
                            $('#div9')[0].className='close1';
                            // $('#ip').removeProp('disabled');
                            // $('#mask').removeProp('disabled');
                        }else{
                            $('#vlan_TableForm').show();
                            // $('#noVlan').hide();
                            $('#div10')[0].className='open2';
                            $('#div9')[0].className='open1';
                            // $('#ip').prop('disabled',true);
                            // $('#mask').prop('disabled',true);
                        }
                        if(rowData.vlan&&rowData.vlan.length>0){
                            $scope.vlan_Table.update(rowData.vlan);
                        }else{
                            $scope.vlan_Table.update([]);
                        }
                        $('#interfaceZone').html('');
                        if(rowData.interface_all.length>0){
                            for(var k=0;k<rowData.interface_all.length;k++){
                                $('<label><input class="interfaceCheck" type="checkbox" name="'+rowData.interface_all[k]+'">'+rowData.interface_all[k]+'</label>').appendTo($('#interfaceZone'));
                            }
                        }
                        $('#interface_dialog').find('input[type=checkbox]').removeProp('checked');
                        if(rowData.interface&&rowData.interface.length>0){
                            for(var i=0;i<$('#interface_dialog').find('input[class=interfaceCheck]').length;i++){
                                for(var j=0;j<rowData.interface.length;j++){
                                    if(rowData.interface[j]==$('#interface_dialog').find('input[class=interfaceCheck]')[i].name){
                                        $('#interface_dialog').find('input[name='+rowData.interface[j]+']').prop('checked',true);
                                    }
                                }
                            }
                        }
                        $('#interface_dialog').modal('show');
                    }else{
                        if( rowData.proto=='dhcp'){
                            $('#dhcpType').show();
                            $('#pppoeType').hide();
                            $('#staticType').hide();
                        }else if(rowData.proto=='pppoe'){
                            $('#dhcpType').hide();
                            $('#pppoeType').show();
                            $('#staticType').hide();
                        }else{
                            $('#dhcpType').hide();
                            $('#pppoeType').hide();
                            $('#staticType').show();
                        }
                        $('#gateway_dialog').modal('show');
                        setTimeout(function(){
                            $scope.$apply(function(e){
                                $scope.gatewayLineData=rowData;
                                $scope.moreDev=true;
                            },10)
                        });
                    }
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            var networkData={};
                            if(rowData.name.indexOf('br')!=-1){
                                for(var i=0;i<$scope.network.bridges.length;i++){
                                    if(rowData.name==$scope.network.bridges[i].name){
                                        $scope.network.bridges.splice(i,1);
                                        networkData={bridges:$scope.network.bridges};
                                    }
                                }
                            }else{
                                for(var i=0;i<$scope.network.interfaces.length;i++){
                                    if(rowData.name==$scope.network.interfaces[i].name){
                                        $scope.network.interfaces.splice(i,1);
                                        networkData={interfaces:$scope.network.interfaces};
                                    }
                                }
                            }
                            rcms.ajax({
                                type: 'post',
                                url: '/apis/conf/set_conf/',
                                data:JSON.stringify({network:networkData})
                            }).success(function (data) {
                                if(data.result=='ok'){
                                    Showbo.Msg.alert('删除成功');
                                    $scope.get_conf();
                                }else{
                                    Showbo.Msg.alert(data.msg);
                                    $scope.get_conf();
                                }
                            })
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.vlanTable=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "vlanTable",
        isAutoResized: false,
        columns: [{
            caption: "VLAN ID",
            name: "vlan_id"
        },{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "子网掩码",
            name: "mask"
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    $('#addOrNotVlan').val('old');
                    $('#vlan_id').attr('disabled','disabled');
                    $('#ip_vlan').val(rowData.ip);
                    $('#mask_vlan').val(rowData.mask);
                    $('#vlan_id').val(rowData.vlan_id);
                    $('#vlanEdit_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    if($scope.vlanTable.gridData.length<2){
                        Showbo.Msg.alert('开启vlan透传应至少保留一条vlan配置');
                        return false;
                    }
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.network.bridges.length;i++){
                                if($scope.network.bridges[i].name==$('#interfaceName').val()){
                                    for(var j=0;j<$scope.network.bridges[i].vlan.length;j++){
                                        if($scope.network.bridges[i].vlan[j].vlan_id==rowData.vlan_id){
                                            $scope.network.bridges[i].vlan.splice(j,1);
                                            window.sessionStorage.network=JSON.stringify($scope.network);
                                            $scope.interfaceTab.update($scope.network.bridges);
                                            $scope.vlanTable.update($scope.vlanTable.gridData);
                                        }
                                    }
                                }
                            }
                            $scope.set_conf($scope.network.bridges);
                            $scope.get_vlanIdArr();
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.vlan_Table=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "vlan_Table",
        isAutoResized: false,
        columns: [{
            caption: "VLAN ID",
            name: "vlan_id"
        },{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "子网掩码",
            name: "mask"
        },{
            caption:"操作",
            name:'',
            width:'30%',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    $('#addOrNotVlan2').val('old');
                    $('#vlan_id2').attr('disabled','disabled');
                    $('#ip_vlan2').val(rowData.ip);
                    $('#mask_vlan2').val(rowData.mask);
                    $('#vlan_id2').val(rowData.vlan_id);
                    $('#vlanEdit_dialog2').modal('show');
                };
                opration[1].onclick = function(){
                    if($scope.vlan_Table.gridData.length<2){
                        Showbo.Msg.alert('开启vlan透传应至少保留一条vlan配置');
                        return false;
                    }
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var k=0;k<$scope.vlan_Table.gridData.length;k++){
                                if($scope.vlan_Table.gridData[k].vlan_id==rowData.vlan_id){
                                    $scope.vlan_Table.gridData.splice(k,1);
                                    $scope.vlan_Table.update($scope.vlan_Table.gridData);
                                }
                            }
                            for(var i=0;i<$scope.network.bridges.length;i++){
                                if($scope.network.bridges[i].name==$('#name').val()){
                                    $scope.network.bridges[i].vlan=$scope.vlan_Table.gridData;
                                }
                            }
                            $scope.get_vlanIdArr();
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.bypassTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "bypassTab",
        isAutoResized: false,
        columns: [{
            caption: "名称",
            name: "name",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='eth0'){
                    option='上网口';
                }else if(value=='eth1'){
                    option='管理口';
                }else{
                    option='监控口'+(parseFloat(value.split('br')[1])+1).toString();
                }
                return option;
            }
        },{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "子网掩码",
            name: "mask"
        },{
            caption: "绑定接口",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(rowData.name.indexOf('eth')!=-1){
                    option=rowData.name;
                }else{
                    for(var i=0;i<rowData.interface.length;i++){
                        if(i==rowData.interface.length-1){
                            option=option+rowData.interface[i]
                        }else{
                            option=option+rowData.interface[i]+'、'
                        }
                    }
                }
                return option;
            }
        },{
            caption:"操作",
            name:'',
            width:'30%',
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(rowData.name=='br0'||(rowData.name.indexOf('eth')!=-1)){
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger ban" style="margin-left: 10px">删除</span>').data(rowData);
                }else{
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                }
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function(e){
                            $scope.bypassLineData=rowData;
                            if(rowData.name.indexOf('br')!=-1){
                                $('#errorMsg').hide();
                                $('#addOrNot').val('old');
                                $('#name').attr('disabled','disabled');
                                $('#name').val(rowData.name);
                                $('#ip').val(rowData.ip);
                                $('#mac').val(rowData.mac);
                                $('#mask').val(rowData.mask);
                                if(rowData.vlan_switch=='0'){
                                    $('#vlan_TableForm').hide();
                                    // $('#noVlan').show();
                                    $('#div10')[0].className='close2';
                                    $('#div9')[0].className='close1';
                                    // $('#ip').removeProp('disabled');
                                    // $('#mask').removeProp('disabled');
                                }else{
                                    $('#vlan_TableForm').show();
                                    // $('#noVlan').hide();
                                    $('#div10')[0].className='open2';
                                    $('#div9')[0].className='open1';
                                    // $('#ip').prop('disabled',true);
                                    // $('#mask').prop('disabled',true);
                                }
                                if(rowData.vlan&&rowData.vlan.length>0){
                                    $scope.vlan_Table.update(rowData.vlan);
                                }else{
                                    $scope.vlan_Table.update([]);
                                }
                                $('#interfaceZone').html('');
                                if(rowData.interface_all.length>0){
                                    for(var k=0;k<rowData.interface_all.length;k++){
                                        $('<label><input class="interfaceCheck" type="checkbox" name="'+rowData.interface_all[k]+'">'+rowData.interface_all[k]+'</label>').appendTo($('#interfaceZone'));
                                    }
                                }
                                $('#interface_dialog').find('input[type=checkbox]').removeProp('checked');
                                if(rowData.interface&&rowData.interface.length>0){
                                    for(var i=0;i<$('#interface_dialog').find('input[class=interfaceCheck]').length;i++){
                                        for(var j=0;j<rowData.interface.length;j++){
                                            if(rowData.interface[j]==$('#interface_dialog').find('input[class=interfaceCheck]')[i].name){
                                                $('#interface_dialog').find('input[name='+rowData.interface[j]+']').prop('checked',true);
                                            }
                                        }
                                    }
                                }
                                if($scope.network.mode=='bypass'){
                                    $('#noBypass').hide();
                                }else{
                                    $('#noBypass').show();
                                }
                                $('#interface_dialog').modal('show');
                            }else{
                                if($scope.bypassLineData.name=='eth1'){
                                    $scope.control=true;
                                }else{
                                    $scope.control=false;
                                }
                                $('#bypass_dialog').modal('show');
                            }
                        })
                    });
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            var networkData={};
                            for(var i=0;i<$scope.network.bridges.length;i++){
                                if(rowData.name==$scope.network.bridges[i].name){
                                    $scope.network.bridges.splice(i,1);
                                    networkData={bridges:$scope.network.bridges};
                                }
                            }
                            rcms.ajax({
                                type: 'post',
                                url: '/apis/conf/set_conf/',
                                data:JSON.stringify({network:networkData})
                            }).success(function (data) {
                                if(data.result=='ok'){
                                    Showbo.Msg.alert('删除成功');
                                    $scope.get_conf();
                                }else{
                                    Showbo.Msg.alert(data.msg);
                                    $scope.get_conf();
                                }
                            })
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $('#div9').on('click',function(){
        $('#div10')[0].className=($('#div10')[0].className=="close2")?"open2":"close2";
        $('#div9')[0].className=($('#div9')[0].className=="close1")?"open1":"close1";
        if($('#div9')[0].className=="open1"){
            $('#vlan_TableForm').show();
            // $('#noVlan').hide();
            // $('#ip').prop('disabled',true);
            // $('#mask').prop('disabled',true);
        }else{
            $('#vlan_TableForm').hide();
            // $('#noVlan').show();
            // $('#ip').removeProp('disabled');
            // $('#mask').removeProp('disabled');
        }
    });
    $('#prototypeChange').on('change',function(){
        if( $('#prototypeChange').val()=='dhcp'){
            $('#dhcpType').show();
            $('#pppoeType').hide();
            $('#staticType').hide();
        }else if($('#prototypeChange').val()=='pppoe'){
            $('#dhcpType').hide();
            $('#pppoeType').show();
            $('#staticType').hide();
        }else{
            $('#dhcpType').hide();
            $('#pppoeType').hide();
            $('#staticType').show();
        }
    });
    $scope.saveBypass=function(){
        for(var i=0;i<$scope.network.interfaces.length;i++){
            if($scope.network.interfaces[i].name==$scope.bypassLineData.name){
                $scope.network.interfaces[i]=$scope.bypassLineData;
            }
        }
        $scope.saveGateway();
    };
    $scope.copyMac=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $scope.gatewayLineData.mac=$scope.network.pc_mac;
            })
        },10)
    };
    $scope.resetMac=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $scope.gatewayLineData.mac='';
            })
        },10)
    };
    $scope.interfaceAdd=function(){
        if($scope.network.mode=='bypass'){
            $('#noBypass').hide();
        }else{
            $('#noBypass').show();
        }
        var nameArr=[];
        for(var k=0;k<$scope.network.interface_all.length;k++){
            nameArr.push('br'+k);
        }
        for(var j=0;j<nameArr.length;j++){
            $("#"+nameArr[j]).attr('style','display:inline');
        }
        for(var i=0;i<$scope.network.bridges.length;i++){
            $("#"+$scope.network.bridges[i].name).attr('style','display:none');
            for(var m=0;m<nameArr.length;m++){
                if($scope.network.bridges[i].name==nameArr[m]){
                    nameArr.splice(m,1);
                }
            }
        }
        if(nameArr.length<1){
            Showbo.Msg.alert("无法添加更多网口配置!");
            return false;
        }
        $("#name").val(nameArr[0]);
        $('#errorMsg').hide();
        $('#addOrNot').val('new');
        $('#interfaceZone').html('');
        if(left_interface.length>0){
            for(var k=0;k<left_interface.length;k++){
                $('<label><input class="interfaceCheck" type="checkbox" name="'+left_interface[k]+'">'+left_interface[k]+'</label>').appendTo($('#interfaceZone'));
            }
        }else{
            $('#interfaceZone').html('<span style="color: red">没有可用端口供选择，将添加失败</span>');
        }
        $('#name').removeAttr('disabled');
        $('#interface_dialog').find('input[type=checkbox]').prop('checked',false);
        $('#ip').val('');
        $('#mask').val('');
        $scope.vlan_Table.update([]);
        $('#div10')[0].className="close2";
        $('#div9')[0].className="close1";
        $('#ip').removeProp('disabled');
        $('#mask').removeProp('disabled');
        $('#vlan_TableForm').hide();
        $('#noVlan').show();
        $('#interface_dialog').modal('show');
    };
    $scope.saveGateway=function(){
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({network:{interfaces:$scope.network.interfaces}})
        }).success(function (data) {
            if(data.result=='ok'){
                $("#wait_dialog").modal("hide");
                rcms.message('保存成功');
                $('#gateway_dialog').modal('hide');
                $('#bypass_dialog').modal('hide');
                $scope.get_conf();
            }else{
                $("#wait_dialog").modal("hide");
                rcms.message(data.msg);
                $('#gateway_dialog').modal('hide');
                $('#bypass_dialog').modal('hide');
                $scope.get_conf();
            }
        })
    };
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'network'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                var all_interface=[];
                all_interface = data.data.interface_all;
                window.sessionStorage.all_interface=JSON.stringify(all_interface);
                $scope.network=data.data;
                window.sessionStorage.network=JSON.stringify(data.data);
                $scope.left_interface();
                $('#name').html('');
                if(data.data.mode=='bridge'){
                    $('#bridgePage').show();
                    $('#gatewayPage').hide();
                    $('#bypassPage').hide();
                    $scope.get_vlanIdArr();
                    $scope.interfaceTab.update($scope.network.bridges);
                    for(var i=0;i<$scope.network.interface_all.length;i++){
                        $('<option value="br'+i+'" id="br'+i+'">网桥'+(i+1).toString()+'</option>').appendTo($('#name'));
                    }
                }else if(data.data.mode=='gateway'){
                    $('#bridgePage').hide();
                    $('#gatewayPage').show();
                    $('#bypassPage').hide();
                    var gatewayTabData=[];
                    for(var i=0;i<data.data.interfaces.length;i++){
                        gatewayTabData.push(data.data.interfaces[i]);
                    }
                    for(var i=0;i<data.data.bridges.length;i++){
                        gatewayTabData.push(data.data.bridges[i]);
                    }
                    $scope.gatewayTab.update(gatewayTabData);
                    for(var i=0;i<$scope.network.interface_all.length;i++){
                        $('<option value="br'+i+'" id="br'+i+'">LAN'+(i+1).toString()+'</option>').appendTo($('#name'));
                    }
                }else if(data.data.mode=='bypass'){
                    $('#bridgePage').hide();
                    $('#gatewayPage').hide();
                    $('#bypassPage').show();
                    var gatewayTabData=[];
                    for(var i=0;i<data.data.interfaces.length;i++){
                        gatewayTabData.push(data.data.interfaces[i]);
                    }
                    for(var i=0;i<data.data.bridges.length;i++){
                        gatewayTabData.push(data.data.bridges[i]);
                    }
                    $scope.bypassTab.update(gatewayTabData);
                    for(var i=0;i<$scope.network.interface_all.length;i++){
                        $('<option value="br'+i+'" id="br'+i+'">监控口'+(i+1).toString()+'</option>').appendTo($('#name'));
                    }
                }
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        });
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/lanwan_status/'
        }).success(function (data) {
            if(data.result=='ok'){
                $scope.$apply(function(e){
                    $scope.interface_info=data.lan_wan_sta;
                })
            }else{
                rcms.message(data.msg);
            }
        }).error(function(e){

        })
    };
    $('#dialog_resetProduct').on('click',function(){
        //var form = $(this);
        var data = $('#interfaceForm').serializeArray();
        var dataArr={};
        var interfaceArr=[];
        for (var i = 0; i < data.length; i++) {
            if (data[i].name.indexOf('eth') != -1) {
                interfaceArr.push(data[i].name);
            }else{
                dataArr[data[i].name] = data[i].value;
            }
        }
        if((!ip_re.test(dataArr.ip))&&$scope.network.mode!='bypass'){
            $('#errorMsg').text('IP格式不正确');
            $('#errorMsg').show();
            return false;
        }
        if((!ip_re.test(dataArr.mask))&&$scope.network.mode!='bypass'){
            $('#errorMsg').text('掩码格式不正确');
            $('#errorMsg').show();
            return false;
        }
        if($('#div9')[0].className=='close1'){
            dataArr.vlan_switch='0';
            dataArr.vlan=[];
        }else{
            dataArr.vlan_switch='1';
            var vlan_idArr = $scope.vlan_Table.gridData;
            if(vlan_idArr.length==0){
                Showbo.Msg.alert('vlan透传开关开启，vlan id不能为空');
                return false;
            }else{
                dataArr.vlan = vlan_idArr;
            }
        }
        dataArr.interface=interfaceArr;
        dataArr.name = $('#name').val();
        dataArr.mode = $('#mode').val();
        if($('#addOrNot').val()=='new'){
            for(var i=0;i<$scope.network.bridges.length;i++){
                if($scope.network.bridges[i].name==dataArr.name){
                    Showbo.Msg.alert('名称已存在');
                    return false;
                }
            }
        }
        if(dataArr.interface.length<1){
            Showbo.Msg.alert('未绑定接口，请先绑定接口');
            return false;
        }
        if($scope.network.mode!='bypass'){
            var ips = Util.getNetCode(dataArr.ip, dataArr.mask);
            for(var i=0;i<$scope.network.bridges.length;i++){
                if($scope.network.bridges[i].name!==dataArr.name){//其他网桥的网段
                    var ips2= Util.getNetCode($scope.network.bridges[i].ip, $scope.network.bridges[i].mask);
                    if (ips ==ips2){
                        Showbo.Msg.alert("IP应在不同网段");
                        return false;
                    }
                }
                for(var j=0;j<$scope.network.bridges[i].vlan.length;j++){
                    if($scope.network.bridges[i].name==dataArr.name){
                        if(dataArr.vlan_switch=='1'){
                            for(var k=0;k<dataArr.vlan.length;k++){
                                var ips2= Util.getNetCode(dataArr.vlan[k].ip,dataArr.vlan[k].mask);
                                if (ips ==ips2){
                                    Showbo.Msg.alert("IP与VLAN IP应为不同网段");
                                    return false;
                                }
                            }
                        }
                    }else{
                        var ips2= Util.getNetCode($scope.network.bridges[i].vlan[j].ip, $scope.network.bridges[i].vlan[j].mask);
                        if (ips ==ips2){
                            Showbo.Msg.alert("IP与VLAN IP应为不同网段");
                            return false;
                        }
                    }
                }
            }
            $scope.get_vlanIdArr();
        }
        if($('#addOrNot').val()=='new'){
            $scope.network.bridges.push(dataArr);
        }else{
            for(var i=0;i<$scope.network.bridges.length;i++){
                if($scope.network.bridges[i].name==dataArr.name){
                    $.each($scope.network.bridges[i], function(key, value){
                        if(key in dataArr){
                            $scope.network.bridges[i][key] = dataArr[key];
                        }
                    });
                }
            }
        }
        $scope.set_conf($scope.network.bridges);
        $scope.left_interface();
        window.sessionStorage.network=JSON.stringify($scope.network);
    });
    $scope.dialog_cancel=function(id){
        $scope.get_conf();
    };
    $scope.left_interface=function () {//计算剩余几个接口未绑定
        left_interface=JSON.parse(window.sessionStorage.all_interface);
        for(var i=0;i<$scope.network.bridges.length;i++){
            for(var j=0;j<$scope.network.bridges[i].interface.length;j++){
                for(k=0;k<left_interface.length;k++){
                    if(left_interface[k]==$scope.network.bridges[i].interface[j]){
                        left_interface.splice(k,1);
                    }
                }
            }
        }
        for(var i=0;i<$scope.network.bridges.length;i++){
            $scope.network.bridges[i].interface_all=[];
            for(var k=0;k<$scope.network.bridges[i].interface.length;k++){
                $scope.network.bridges[i].interface_all.push($scope.network.bridges[i].interface[k]);
            }
            for(var j=0;j<left_interface.length;j++){
                $scope.network.bridges[i].interface_all.push(left_interface[j]);
            }
        }
    };
    $scope.set_conf=function(bridges){
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({network:{bridges:bridges}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                $('#errorMsg').hide();
                rcms.message('网络配置成功，可能需要重新连接');
                $('#interface_dialog').modal('hide');
                $scope.get_conf();
            }else{
                Showbo.Msg.alert(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.get_vlanIdArr=function () {
        $scope.vlanIdArr=[];
        for(var k=0;k<$scope.network.bridges.length;k++){
            if($scope.network.bridges[k].vlan_switch=='1'){
                if($scope.network.bridges[k].vlan.length>0){
                    for(var m=0;m<$scope.network.bridges[k].vlan.length;m++){
                        $scope.vlanIdArr.push($scope.network.bridges[k].vlan[m]);
                    }
                }
            }
        }
    };
    $('#add_vlan').on('click',function(){
        $('#vlan_id').removeAttr('disabled');
        $('#addOrNotVlan').val('new');
        $('#ip_vlan').val('');
        $('#mask_vlan').val('');
        $('#vlan_id').val('');
        $('#vlanEdit_dialog').modal('show');
    });
    $('#addVlan').on('click',function(){
        $('#vlan_id2').removeAttr('disabled');
        $('#addOrNotVlan2').val('new');
        $('#ip_vlan2').val('');
        $('#mask_vlan2').val('');
        $('#vlan_id2').val('');
        $('#vlanEdit_dialog2').modal('show');
    });
    $scope.vlanIdArr=[];
    $('#vlanEditForm').submit(function(e){
        var form = $(this);
        var data = form.serializeArray();
        var dataArr={};
        for (var i = 0; i < data.length; i++) {
            dataArr[data[i].name] = data[i].value;
        }
        dataArr.vlan_id=$('#vlan_id').val();
        if(parseInt(dataArr.vlan_id)<1||parseInt(dataArr.vlan_id)>4094 || !(/^\d+$/.test(dataArr.vlan_id))){
            Showbo.Msg.alert('vlan id范围应在1~4094');
            $("#vlan_id").val('');
            $("#vlan_id").focus();
            return false;
        }
        for(var i=0;i<$scope.vlanIdArr.length;i++){
            if($('#addOrNotVlan').val()=='new' && $("#vlan_id").val()==$scope.vlanIdArr[i].vlan_id){
                Showbo.Msg.alert('VLAN ID 已存在，请重新输入');
                $("#vlan_id").val('');
                $("#vlan_id").focus();
                return false;
            }
        }
        if(!ip_re.test(dataArr.ip)){
            Showbo.Msg.alert('IP格式不正确');
            return false;
        }
        if(!ip_re.test(dataArr.mask)){
            Showbo.Msg.alert('掩码格式不正确');
            return false;
        }
        var ips = Util.getNetCode(dataArr.ip, dataArr.mask);
        for(var i=0;i<$scope.network.bridges.length;i++){
            var ips2= Util.getNetCode($scope.network.bridges[i].ip, $scope.network.bridges[i].mask);
            if (ips ==ips2){
                Showbo.Msg.alert("网桥IP与VLAN IP应为不同网段");
                return false;
            }
            for(var j=0;j<$scope.network.bridges[i].vlan.length;j++){
                if($scope.network.bridges[i].vlan[j].vlan_id!==$("#vlan_id").val()){
                    var ips2= Util.getNetCode($scope.network.bridges[i].vlan[j].ip, $scope.network.bridges[i].vlan[j].mask);
                    if (ips ==ips2){
                        Showbo.Msg.alert("VLAN IP应为不同网段");
                        return false;
                    }
                }
            }
        }
        if($('#addOrNotVlan').val()=='new'){
            $scope.vlanTable.gridData.push(dataArr);
        }else{
            for(var k=0;k<$scope.vlanTable.gridData.length;k++){
                if($scope.vlanTable.gridData[k].vlan_id==dataArr.vlan_id){
                    $scope.vlanTable.gridData[k]=dataArr;
                }
            }
        }
        $scope.vlanTable.update($scope.vlanTable.gridData);
        var interfaceName=$('#interfaceName').val();
        for(var j=0;j<$scope.network.bridges.length;j++){
            if($scope.network.bridges[j].name==interfaceName){
                $scope.network.bridges[j].vlan=$scope.vlanTable.gridData;
            }
        }
        window.sessionStorage.network=JSON.stringify($scope.network);
        $scope.interfaceTab.update($scope.network.bridges);
        if($('#addOrNotVlan').val()=='new'){
            $scope.vlanIdArr.push({vlan_id:$("#vlan_id").val()});
        }
        $scope.set_conf($scope.network.bridges);
        $('#vlanEdit_dialog').modal('hide');
    });
    $('#vlanEditForm2').submit(function(e){
        var form = $(this);
        var data = form.serializeArray();
        var dataArr={};
        for (var i = 0; i < data.length; i++) {
            dataArr[data[i].name] = data[i].value;
        }
        dataArr.vlan_id=$("#vlan_id2").val();
        if(parseInt(dataArr.vlan_id)<1||parseInt(dataArr.vlan_id)>4094 || !(/^\d+$/.test(dataArr.vlan_id))){
            Showbo.Msg.alert('vlan id范围应在1~4094');
            $("#vlan_id2").val('');
            $("#vlan_id2").focus();
            return false;
        }
        for(var i=0;i<$scope.vlanIdArr.length;i++){
            if($('#addOrNotVlan2').val()=='new'&&$("#vlan_id2").val()==$scope.vlanIdArr[i].vlan_id){
                Showbo.Msg.alert('VLAN ID 已存在，请重新输入');
                $("#vlan_id2").val('');
                $("#vlan_id2").focus();
                return false;
            }
        }
        if(!ip_re.test(dataArr.ip)){
            Showbo.Msg.alert('IP格式不正确');
            return false;
        }
        if(!ip_re.test(dataArr.mask)){
            Showbo.Msg.alert('掩码格式不正确');
            return false;
        }
        var ips = Util.getNetCode(dataArr.ip, dataArr.mask);
        var ips2= Util.getNetCode($('#ip').val(),$('#mask').val());
        if (ips ==ips2){//该桥的网段对比
            Showbo.Msg.alert("网桥IP与VLAN IP应为不同网段");
            return false;
        }
        for(var i=0;i<$scope.network.bridges.length;i++){
            if($scope.network.bridges[i].name!=$('#name').val()){//其他桥的网段
                var ips2= Util.getNetCode($scope.network.bridges[i].ip, $scope.network.bridges[i].mask);
                if (ips ==ips2){
                    Showbo.Msg.alert("网桥IP与VLAN IP应为不同网段");
                    return false;
                }
            }
            for(var j=0;j<$scope.network.bridges[i].vlan.length;j++){
                if($scope.network.bridges[i].vlan[j].vlan_id!==$("#vlan_id2").val()){//除去自身的其他vlan网段
                    var ips2= Util.getNetCode($scope.network.bridges[i].vlan[j].ip, $scope.network.bridges[i].vlan[j].mask);
                    if (ips ==ips2){
                        Showbo.Msg.alert("VLAN IP应为不同网段");
                        return false;
                    }
                }
            }
        }
        for(var j=0;j<$scope.vlan_Table.gridData.length;j++){
            if($scope.vlan_Table.gridData[j].vlan_id!==$("#vlan_id2").val()){//除去自身的同个网桥的vlan网段
                var ips2= Util.getNetCode($scope.vlan_Table.gridData[j].ip, $scope.vlan_Table.gridData[j].mask);
                if (ips ==ips2){
                    Showbo.Msg.alert("VLAN IP应为不同网段");
                    return false;
                }
            }
        }
        if($('#addOrNotVlan2').val()=='new'){
            $scope.vlan_Table.gridData.push(dataArr);
            $scope.vlanIdArr.push({vlan_id:$("#vlan_id2").val()});
        }else{
            dataArr.vlan_id=$("#vlan_id2").val();
            for(var k=0;k<$scope.vlan_Table.gridData.length;k++){
                if($scope.vlan_Table.gridData[k].vlan_id==dataArr.vlan_id){
                    $scope.vlan_Table.gridData[k]=dataArr;
                }
            }
        }
        for(var i=0;i<$scope.network.bridges.length;i++){
            if($scope.network.bridges[i].name==$('#name').val()){
                $scope.network.bridges[i].vlan=$scope.vlan_Table.gridData;
            }
        }
        $scope.vlan_Table.update($scope.vlan_Table.gridData);
        $('#vlanEdit_dialog2').modal('hide');
    });
    $scope.get_conf();
});
myApp.controller('networkMode', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/networkMode';
    $scope.get_swith_mode=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'network'})
        }).success(function (data) {
            if(data.result=='ok'){
                $("#wait_dialog").modal("hide");
                $scope.$apply(function (e) {
                    $scope.mode=data.data.mode;
                    if($scope.mode=='gateway'){
                        $scope.swith_gateway = true;
                        $scope.swith_bridge = false;
                        $scope.swith_bypass = false;
                        $scope.class_gateway = 'btn btn-primary';
                        $scope.class_bridge = 'btn btn-default';
                        $scope.class_bypass = 'btn btn-default';
                    }else if($scope.mode=='bridge'){
                        $scope.swith_gateway = false;
                        $scope.swith_bridge = true;
                        $scope.swith_bypass = false;
                        $scope.class_bridge = 'btn btn-primary';
                        $scope.class_gateway = 'btn btn-default';
                        $scope.class_bypass = 'btn btn-default';
                    }else if($scope.mode=='bypass'){
                        $scope.swith_gateway = false;
                        $scope.swith_bridge = false;
                        $scope.swith_bypass = true;
                        $scope.class_bridge = 'btn btn-default';
                        $scope.class_gateway = 'btn btn-default';
                        $scope.class_bypass = 'btn btn-primary';
                    }
                })
            }else{
                $("#wait_dialog").modal("hide");
                Showbo.Msg.alert(data.msg);
            }
        })
    };
    $scope.swith_mode=function(id){
        Showbo.Msg.confirm('切换模式后设备将恢复出厂设置并重启，确定要切换工作模式吗？', function(btn) {
            if(btn=='no'){
                $scope.$apply(function (e) {
                    if($scope.mode=='gateway'){
                        $scope.swith_gateway = true;
                        $scope.swith_bridge = false;
                        $scope.swith_bypass = false;
                        $scope.class_gateway = 'btn btn-primary';
                        $scope.class_bridge = 'btn btn-default';
                        $scope.class_bypass = 'btn btn-default';
                    }else if($scope.mode=='bridge'){
                        $scope.swith_gateway = false;
                        $scope.swith_bridge = true;
                        $scope.swith_bypass = false;
                        $scope.class_bridge = 'btn btn-primary';
                        $scope.class_gateway = 'btn btn-default';
                        $scope.class_bypass = 'btn btn-default';
                    }else if($scope.mode=='bypass'){
                        $scope.swith_gateway = false;
                        $scope.swith_bridge = false;
                        $scope.swith_bypass = true;
                        $scope.class_bridge = 'btn btn-default';
                        $scope.class_gateway = 'btn btn-default';
                        $scope.class_bypass = 'btn btn-primary';
                    }
                });
                return false;
            }else{
                var swith_mode=($scope.swith_gateway?'gateway':($scope.swith_bridge?'bridge':'bypass'));
                rcms.ajax({
                    type: 'post',
                    url: '/apis/conf/switch_mode/',
                    data:JSON.stringify({mode:swith_mode})
                }).success(function (data) {
                    if(data.result=='ok'){
                        $scope.$apply(function (e) {
                            if(id==1){
                                $scope.swith_gateway = true;
                                $scope.swith_bridge = false;
                                $scope.swith_bypass = false;
                                $scope.class_gateway = 'btn btn-primary';
                                $scope.class_bridge = 'btn btn-default';
                                $scope.class_bypass = 'btn btn-default';
                            }else if(id==2){
                                $scope.swith_gateway = false;
                                $scope.swith_bridge = true;
                                $scope.swith_bypass = false;
                                $scope.class_bridge = 'btn btn-primary';
                                $scope.class_gateway = 'btn btn-default';
                                $scope.class_bypass = 'btn btn-default';
                            }else if(id==3){
                                $scope.swith_gateway = false;
                                $scope.swith_bridge = false;
                                $scope.swith_bypass = true;
                                $scope.class_bridge = 'btn btn-default';
                                $scope.class_gateway = 'btn btn-default';
                                $scope.class_bypass = 'btn btn-primary';
                            }
                        });
                        rcms.message('切换成功');
                    }else{
                        Showbo.Msg.alert(data.msg);
                    }
                })
            }
        });
        if(id==1){
            $scope.swith_gateway = true;
            $scope.swith_bridge = false;
            $scope.swith_bypass = false;
        }else if(id==2){
            $scope.swith_gateway = false;
            $scope.swith_bridge = true;
            $scope.swith_bypass = false;
        }else if(id==3){
            $scope.swith_gateway = false;
            $scope.swith_bridge = false;
            $scope.swith_bypass = true;
        }
    };
    $scope.get_swith_mode();
});
myApp.controller('routerDev', function ($scope, Data,$timeout) {
    var ip_re = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/;
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/routerDev';
    $scope.routerTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "routerTab",
        isAutoResized: false,
        columns: [{
            caption: "IP地址",
            name: " ",
            formater:function (rowIndex, value, rowData) {
                var ip=" ";
                if(rowData.id=="1"){
                    ip=rowData.ip+" (网关)";
                }else{
                    ip=rowData.ip;
                }
                return ip;
            }
        },{
            caption: "掩码地址",
            name: "mask"
        },{
            caption: "下一跳地址",
            name: "next_route"
        },{
            caption:"操作",
            name:'',
            width:'30%',
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(rowData.id=="1"){
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger ban" style="margin-left: 10px">删除</span>').data(rowData);
                }else{
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                }
                opration[0].onclick = function(){
                    $('#errorMsg2').hide();
                    $('#addOrEdit').val('edit');
                    $('#routes_id').val(rowData.id);
                    $('#routes_ip').val(rowData.ip);
                    $('#routes_mask').val(rowData.mask);
                    $('#next_route').val(rowData.next_route);
                    $('#routes_dialog').modal('show');
                    if(rowData.id=="1"){
                        $('#routes_ip').attr("disabled",true);
                        $('#routes_mask').attr("disabled",true);
                    }else{
                        $('#routes_ip').attr("disabled",false);
                        $('#routes_mask').attr("disabled",false);
                    }
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.network.routes.length;i++){
                                if($scope.network.routes[i].id==rowData.id){
                                    $scope.network.routes.splice(i,1);
                                }
                            }
                            window.sessionStorage.network=JSON.stringify($scope.network);
                            $scope.setRoutes($scope.network.routes);
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.balanceTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "balanceTab",
        isAutoResized: false,
        columns: [{
            caption: "线路名称",
            name: "value"
        },{
            caption: "线路类型",
            name: "type",
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(value=='1'){
                    opration="主线路";
                }else{
                    opration="备份线路";
                }
                return opration;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">线路类型切换</span>').data(rowData);
                opration[0].onclick = function(){
                    var type='';
                    var change='';
                    if(rowData.type=='1'){
                        type='备份线路';
                        change='2';
                    }else{
                        type='主线路';
                        change='1';
                    }
                    Showbo.Msg.confirm('确定要切换为'+type+'吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0; i<$scope.balanceData.multi_line.length;i++){
                                if($scope.balanceData.multi_line[i].name==rowData.name){
                                    $scope.balanceData.multi_line[i].type=change;
                                }
                            }
                            $scope.setBlance();
                        }
                    })
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'network'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                window.sessionStorage.network=JSON.stringify(data.data);
                $scope.network=data.data;
                $scope.routerTab.update($scope.network.routes);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.getBlance=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'mwan3'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                $scope.balanceData=data.data;
                $('#div2')[0].className=($scope.balanceData.enable=="1")?"open2":"close2";
                $('#div1')[0].className=($scope.balanceData.enable=="1")?"open1":"close1";
                $scope.balanceTab.update($scope.balanceData.multi_line);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.setBlance=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({mwan3:$scope.balanceData})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('设置成功');
                $scope.balanceTab.update($scope.balanceData.multi_line);
            }else{
                Showbo.Msg.alert(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.getBlance();
    $('#add_router').on('click',function(){
        $('#errorMsg2').hide();
        $('#addOrEdit').val('add');
        $('#routes_ip').val('');
        $('#routes_mask').val('255.255.255.0');
        $('#routes_ip').attr("disabled",false);
        $('#routes_mask').attr("disabled",false);
        $('#next_route').val('');
        $('#routes_id').val($scope.network.routes.length+1);
        $('#routes_dialog').modal('show');
    });
    $('#routerForm').submit(function(){
        var form = $(this);
        var data = form.serializeArray();
        var dataArr={};
        for (var i = 0; i < data.length; i++) {
            dataArr[data[i].name] = data[i].value;
        }
        if(dataArr.id!="1"){
            if(!ip_re.test(dataArr.ip)){
                $('#errorMsg2').text('IP格式不正确');
                $('#errorMsg2').show();
                return false;
            }
            if(!ip_re.test(dataArr.mask)){
                $('#errorMsg2').text('掩码格式不正确');
                $('#errorMsg2').show();
                return false;
            }
        }else{
            dataArr.ip="0.0.0.0";
            dataArr.mask="0.0.0.0";
        }
        if(!ip_re.test(dataArr.next_route)){
            $('#errorMsg2').text('下一跳格式不正确');
            $('#errorMsg2').show();
            return false;
        }
        if($('#addOrEdit').val()=='edit'){//编辑
            for(var i=0;i<$scope.network.routes.length;i++){
                if($('#routes_id').val()==$scope.network.routes[i].id){
                    $scope.network.routes[i].ip=dataArr.ip;
                    $scope.network.routes[i].mask=dataArr.mask;
                    $scope.network.routes[i].next_route=dataArr.next_route;
                }
            }
        }else{//添加
            $scope.network.routes.push(dataArr);
        }
        window.sessionStorage.network=JSON.stringify($scope.network);
        $scope.setRoutes($scope.network.routes);
        $('#routes_dialog').modal('hide');
    });
    $scope.setRoutes = function(routes){
        $('#errorMsg2').hide();
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({network:{routes:routes}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('设置成功');
                $scope.routerTab.update($scope.network.routes);
                $('#routes_dialog').modal('hide');
            }else{
                Showbo.Msg.alert(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //alert(data.msg);
        })
    };
    $('#div1').on('click',function(){
        if($('#div1')[0].className=="open1"){
            Showbo.Msg.confirm('确定要关闭负载均衡吗？', function(btn) {
                if (btn == "no") {
                    $('#div2')[0].className="open2";
                    $('#div1')[0].className="open1";
                    return false;
                } else {
                    $scope.balanceData.enable='0';
                    $scope.setBlance();
                }
            });
        }else{
            Showbo.Msg.confirm('确定要开启负载均衡吗？', function(btn) {
                if (btn == "no") {
                    $('#div2')[0].className="close2";
                    $('#div1')[0].className="close1";
                    return false;
                } else {
                    $scope.balanceData.enable='1';
                    $scope.setBlance();
                }
            });
        }
        $('#div2')[0].className=($('#div2')[0].className=="close2")?"open2":"close2";
        $('#div1')[0].className=($('#div1')[0].className=="close1")?"open1":"close1";
    });
    $scope.get_conf();
});
myApp.controller('dnsDev', function ($scope, Data,$timeout) {
    var ip_re = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/;
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/dnsDev';
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'network'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                window.sessionStorage.network=JSON.stringify(data.data);
                $scope.network=data.data;
                for(var j=0;j<3;j++){
                    $("#dns"+j).val("");
                }
                for(var i=0;i<$scope.network.dns_addr.length;i++){
                    $("#dns"+i).val($scope.network.dns_addr[i]);
                }
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $('#dnsFormSub').submit(function(){
        $scope.network.dns_addr=[];//清空
        if(!ip_re.test($('#dns0').val())){
            Showbo.Msg.alert('首选DNS服务器格式不正确');
            return false;
        };
        if((!!$('#dns1').val())&&(!ip_re.test($('#dns1').val()))){
            Showbo.Msg.alert('备用DNS服务器1格式不正确');
            return false;
        };
        if((!!$('#dns2').val())&&(!ip_re.test($('#dns2').val()))){
            Showbo.Msg.alert('备用DNS服务器2格式不正确');
            return false;
        };
        $scope.network.dns_addr.push($('#dns0').val());
        if(!!$('#dns1').val()){
            $scope.network.dns_addr.push($('#dns1').val());
        }
        if(!!$('#dns2').val()){
            $scope.network.dns_addr.push($('#dns2').val());
        }
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({network:{dns_addr:$scope.network.dns_addr}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('设置成功');
            }else{
                Showbo.Msg.alert(data.msg);
                $scope.get_conf();
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //alert(data.msg);
        })
    });
    $scope.get_conf();
});
myApp.controller('dhcpDev', function ($scope, Data,$timeout) {
    var ip_re = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/;
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/dhcpDev';
    $scope.serviceTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "serviceTab",
        isAutoResized: false,
        columns: [{
            caption: "名称",
            name: "name"
        },{
            caption: "地址范围",
            name: "",
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(rowData.ranges&&rowData.ranges.length>0){
                    if(rowData.ranges.length==1){
                        opration=rowData.ranges[0].start+'~'+rowData.ranges[0].end;
                    }else if(rowData.ranges.length>1){
                        opration=$('<span class="btn btn-info">查看详情</span><span>'+rowData.ranges[0].start+'~'+rowData.ranges[0].end+'</span>').data(rowData);
                        opration[1].title=rowData.ranges[0].start+'~'+rowData.ranges[0].end;
                        opration[0].onclick = function(){
                            var rangeData='';
                            for(var i=0;i<rowData.ranges.length;i++){
                                rangeData=rangeData+rowData.ranges[i].start+'~'+rowData.ranges[i].end+'<br>';
                            }
                            Showbo.Msg.alert(rangeData);
                        };
                    }
                }
                return opration;
            }
        },{
            caption: "默认网关",
            name: "routers"
        },{
            caption: "租用时间(分钟)",
            name: "lease_time"
        },{
            caption: "DNS",
            name: "dns1",
            formater:function(rowIndex, value, rowData){
                var opration='首选：'+value;
                if(rowData.dns2){
                    opration=opration+';备选：'+rowData.dns2;
                }
                return opration;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(rowData.name=='br0'){
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger ban" style="margin-left: 10px">删除</span>').data(rowData);
                }else{
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                }
                opration[0].onclick = function(){
                    $('#service_dialog').modal('show');
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.serviceData=rowData;
                            $scope.serviceData.edit=rowData.pools_id;
                        })
                    },10)
                };
                opration[1].onclick = function(){
                    $scope.serviceData=rowData;
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.dhcpConf.pools.length;i++){
                                if($scope.dhcpConf.pools[i].pools_id==rowData.pools_id){
                                    $scope.dhcpConf.pools.splice(i,1);
                                }
                            }
                            rcms.ajax({
                                type: 'post',
                                url: '/apis/conf/set_conf/',
                                data:JSON.stringify({dhcpd:$scope.dhcpConf})
                            }).success(function (data) {
                                if(data.result=='ok'){
                                    rcms.message('设置成功');
                                    $scope.get_conf();
                                }else{
                                    Showbo.Msg.alert(data.msg);
                                    $scope.get_conf();
                                }
                            })
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.staticTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "staticTab",
        isAutoResized: false,
        columns: [{
            caption: "客户名称",
            name: "name"
        },{
            caption: "客户端IP",
            name: "ip"
        },{
            caption: "客户端MAC",
            name: "mac"
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(rowData.id=="1"){
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger ban" style="margin-left: 10px">删除</span>').data(rowData);
                }else{
                    opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                }
                opration[0].onclick = function(){
                    $scope.staticData={};
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.staticData=rowData;
                        })
                    },10);
                    $('#static_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    $scope.staticData=rowData;
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.dhcpConf.hosts.length;i++){
                                if($scope.dhcpConf.hosts[i].host_id==rowData.host_id){
                                    $scope.dhcpConf.hosts.splice(i,1);
                                }
                            }
                            rcms.ajax({
                                type: 'post',
                                url: '/apis/conf/set_conf/',
                                data:JSON.stringify({dhcpd:$scope.dhcpConf})
                            }).success(function (data) {
                                if(data.result=='ok'){
                                    rcms.message('设置成功');
                                    $scope.get_conf();
                                }else{
                                    Showbo.Msg.alert(data.msg);
                                    $scope.get_conf();
                                }
                            })
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.macNectTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "macNectTab",
        isAutoResized: false,
        columns: [{
            caption: "已分配的IP地址",
            name: "ip"
        },{
            caption: "MAC地址",
            name: "mac"
        },{
            caption: "主机名",
            name: "client_hostname"
        },{
            caption: "获得租约时间",
            name: "start"
        },{
            caption: "租约过期时间",
            name: "end"
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.rangeTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "rangeTab",
        isAutoResized: false,
        columns: [{
            caption: "开始地址",
            name: "start"
        },{
            caption: "结束地址",
            name: "end"
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger" style="margin-left: 10px">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.rangeData=rowData;
                            $scope.rangeData.edit=1;
                        })
                    },10);
                    $('#rangeEdit_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    $scope.rangeData=rowData;
                    Showbo.Msg.confirm('确定要删除该配置吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.serviceData.ranges.length;i++){
                                if($scope.serviceData.ranges[i].name==rowData.name){
                                    $scope.serviceData.ranges.splice(i,1);
                                    $scope.rangeTab.update($scope.serviceData.ranges);
                                }
                            }
                            if($scope.serviceData.pools_id<$scope.dhcpConf.pools.length+1){
                                for(var j=0;j<$scope.dhcpConf.pools.length;j++){
                                    if($scope.dhcpConf.pools[j]==$scope.serviceData.pools_id){
                                        $scope.dhcpConf.pools[j]=$scope.serviceData;
                                    }
                                }
                            }else{

                            }
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $('#div1').on('click',function(){
        if($scope.dhcpConf.mode=='bridge'){
            Showbo.Msg.alert('网桥模式不支持开启DHCP服务');
            return false;
        }
        if($('#div1')[0].className=="open1"){
            Showbo.Msg.confirm('确定要关闭DHCP吗？', function(btn) {
                if (btn == "no") {
                    return false;
                } else {
                    $scope.dhcpConf.enable='0';
                    $scope.set_conf(0);
                }
            });
        }else{
            Showbo.Msg.confirm('确定要开启DHCP吗？', function(btn) {
                if (btn == "no") {
                    return false;
                } else {
                    $scope.dhcpConf.enable='1';
                    $scope.set_conf(1);
                }
            });
        }
    });
    $scope.serviceAdd=function(){
        $('#service_dialog').modal('show');
        if($scope.serviceData){
            if($scope.serviceData.ranges){
                $scope.serviceData.ranges=[];
                $scope.rangeTab.update($scope.serviceData.ranges);
            }
        }
        setTimeout(function(){
            $scope.$apply(function (e) {
                $scope.serviceData={pools_id:($scope.dhcpConf.pools?$scope.dhcpConf.pools.length+1:1)};
            })
        },10)
    };
    $scope.add_static=function(){
        setTimeout(function(){
            $scope.$apply(function (e) {
                $scope.staticData={};
            })
        },10);
        $('#static_dialog').modal('show');
    };

    $scope.selectValue='';
    $scope.selectIp=function(){
        var leasesData=[];
        for(var i=0;i<$scope.dhcpConf.leases.length;i++){
            if($scope.dhcpConf.leases[i].ip.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.dhcpConf.leases[i]);
            }
        }
        $scope.macNectTab.update(leasesData);
    };
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'dhcpd'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                $('#div2')[0].className=(data.data.enable=='1')?"open2":"close2";
                $('#div1')[0].className=(data.data.enable=='1')?"open1":"close1";
                $scope.dhcpConf={enable:data.data.enable,hosts:data.data.hosts,pools:data.data.pools,leases:data.data.leases,mode:data.data.mode};
                $scope.staticTab.update($scope.dhcpConf.hosts);
                $scope.serviceTab.update($scope.dhcpConf.pools);
                $scope.macNectTab.update($scope.dhcpConf.leases);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.set_conf=function(id){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({dhcpd:$scope.dhcpConf})
        }).success(function (data) {
            if(data.result=='ok'){
                rcms.message('设置成功');
                if(id==0){
                    $('#div2')[0].className=($('#div2')[0].className=="close2")?"open2":"close2";
                    $('#div1')[0].className=($('#div1')[0].className=="close1")?"open1":"close1";
                }else{
                    $('#div2')[0].className=($('#div2')[0].className=="close2")?"open2":"close2";
                    $('#div1')[0].className=($('#div1')[0].className=="close1")?"open1":"close1";
                }
            }else{
                Showbo.Msg.alert(data.msg);
            }
        })
    };
    $scope.delSelectService=function(){
        if ($scope.serviceTab.getSelectedRows().length <= 0) {
            alert("请选择要删除的配置项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中配置项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var service_id=$scope.serviceTab.getSelectedRows();
                for(var d=0;d<service_id.length;d++){
                    for(var i=0;i<$scope.dhcpConf.pools.length;i++){
                        if($scope.dhcpConf.pools[i].pools_id==service_id[d].pools_id){
                            $scope.dhcpConf.pools.splice(i,1);
                        }
                    }
                }
                rcms.ajax({
                    type: 'post',
                    url: '/apis/conf/set_conf/',
                    data:JSON.stringify({dhcpd:$scope.dhcpConf})
                }).success(function (data) {
                    if(data.result=='ok'){
                        rcms.message('设置成功');
                        $scope.get_conf();
                    }else{
                        Showbo.Msg.alert(data.msg);
                        $scope.get_conf();
                    }
                })
            }
        })
    };
    $scope.delSelectStatic=function(){
        if ($scope.staticTab.getSelectedRows().length <= 0) {
            Showbo.Msg.alert("请选择要删除的配置项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中配置项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var static_id = $scope.staticTab.getSelectedRows();
                for (var d = 0; d < static_id.length; d++) {
                    for(var i=0;i<$scope.dhcpConf.hosts.length;i++){
                        if($scope.dhcpConf.hosts[i].host_id==static_id[d].host_id){
                            $scope.dhcpConf.hosts.splice(i,1);
                        }
                    }
                }
                rcms.ajax({
                    type: 'post',
                    url: '/apis/conf/set_conf/',
                    data:JSON.stringify({dhcpd:$scope.dhcpConf})
                }).success(function (data) {
                    if(data.result=='ok'){
                        rcms.message('设置成功');
                        $scope.get_conf();
                    }else{
                        Showbo.Msg.alert(data.msg);
                        $scope.get_conf();
                    }
                })
            }
        })
    };
    $scope.editService=function(){
        if($scope.serviceData.edit){
            for(var k=0;k<$scope.dhcpConf.pools.length;k++){
                if($scope.dhcpConf.pools[k].pools_id==$scope.serviceData.pools_id){
                    $scope.dhcpConf.pools[k]=$scope.serviceData;
                }
            }
        }else{
            $scope.dhcpConf.pools.push($scope.serviceData);
        }
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({dhcpd:$scope.dhcpConf})
        }).success(function (data) {
            if(data.result=='ok'){
                rcms.message('设置成功');
                $scope.get_conf();
                $('#service_dialog').modal('hide');
            }else{
                Showbo.Msg.alert(data.msg);
                $scope.get_conf();
                //$('#service_dialog').modal('hide');
            }
        }).error(function(){
            $('#service_dialog').modal('hide');
        })
    };
    $scope.editStatic=function(){
        if($scope.staticData.host_id){
            for(var k=0;k<$scope.dhcpConf.hosts.length;k++){
                if($scope.dhcpConf.hosts[k].host_id==$scope.staticData.host_id){
                    $scope.dhcpConf.hosts[k]=$scope.staticData;
                }
            }
        }else{
            $scope.dhcpConf.hosts.push($scope.staticData);
        }
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({dhcpd:$scope.dhcpConf})
        }).success(function (data) {
            if(data.result=='ok'){
                rcms.message('设置成功');
                $('#static_dialog').modal('hide');
                $scope.get_conf();
            }else{
                Showbo.Msg.alert(data.msg);
                $scope.get_conf();
            }
        }).error(function(){
            $('#static_dialog').modal('hide');
        })
    };
    $scope.rangeMsg=function(){
        $scope.rangeTab.update($scope.serviceData.ranges);
        $('#range_dialog').modal('show');
    };
    $scope.add_range=function(){
        $scope.rangeData={name:($scope.serviceData.ranges?$scope.serviceData.ranges.length+1:1)};
        $('#rangeEdit_dialog').modal('show');
    };
    $scope.editRange=function(){
        if($scope.serviceData.edit) {
            if ($scope.rangeData.edit) {
                for (var k = 0; k < $scope.dhcpConf.pools.length; k++) {
                    if ($scope.dhcpConf.pools[k].pools_id == $scope.serviceData.pools_id) {
                        for (var m = 0; m < $scope.dhcpConf.pools[k].ranges.length; m++) {
                            if ($scope.dhcpConf.pools[k].ranges[m].name == $scope.rangeData.name) {
                                $scope.dhcpConf.pools[k].ranges[m] = $scope.rangeData;
                                $scope.rangeTab.update($scope.dhcpConf.pools[k].ranges);
                            }
                        }
                    }
                }
            } else {
                for (var k = 0; k < $scope.dhcpConf.pools.length; k++) {
                    if ($scope.dhcpConf.pools[k].pools_id == $scope.serviceData.pools_id) {
                        if($scope.dhcpConf.pools[k].ranges){
                            $scope.dhcpConf.pools[k].ranges.push($scope.rangeData);
                        }else{
                            $scope.dhcpConf.pools[k].ranges=[];
                            $scope.dhcpConf.pools[k].ranges.push($scope.rangeData);
                        }
                        $scope.rangeTab.update($scope.dhcpConf.pools[k].ranges);
                    }
                }
            }
        }else{
            if ($scope.rangeData.edit) {
                for(var k=0;k<$scope.serviceData.ranges.length;k++){
                    if($scope.serviceData.ranges[k].name==$scope.rangeData.name){
                        $scope.serviceData.ranges[k]=$scope.rangeData;
                    }
                }
            }else{
                if($scope.serviceData.ranges){
                    $scope.rangeData.name=$scope.serviceData.ranges.length+1;
                    $scope.serviceData.ranges.push($scope.rangeData);
                }else{
                    $scope.serviceData.ranges=[];
                    $scope.rangeData.name=$scope.serviceData.ranges.length+1;
                    $scope.serviceData.ranges.push($scope.rangeData);
                }
            }
            $scope.rangeTab.update($scope.serviceData.ranges);
        }
        $('#rangeEdit_dialog').modal('hide');
    };
    $scope.get_conf();
    $scope.getMacNect=function(){
        if($('#dnsPage').hasClass('active')){
            rcms.ajax({
                type: 'post',
                url: '/apis/conf/get_conf/',
                data:JSON.stringify({conf_name:'dhcpd'})
            }).success(function (data) {
                if(data.result=='ok'){
                    $scope.macNectTab.update(data.data.leases);
                    setTimeout($scope.getMacNect,5000);
                }else{
                    rcms.message(data.msg);
                }
            }).error(function(data){
            })
        }else{
            setTimeout($scope.getMacNect,5000);
        }
    };
});
myApp.controller('updateDev', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/updateDev';
    $scope.fileupload=function(){
        if($("#bbfile").val()){
            Showbo.Msg.confirm('是否确认升级？', function(btn){
                if(btn=="no"){
                    return false;
                }else{
                    $("#wait_dialog").modal("show");
                    var save_conf=($('#div7')[0].className=="close1")?false:true;
                    $.ajaxFileUpload({
                        type:'POST',
                        dataType: 'JSON',
                        url: '/apis/upload/',
                        data:{save_conf:save_conf},
                        secureuri:false,
                        fileElementId:'bbfile',
                        success:function (data) {
                            $("#wait_dialog").modal("hide");
                            var s=document.createElement('div');
                            s.innerHTML = data;
                            var dataArr =  JSON.parse(s.getElementsByTagName('pre')[0].innerHTML);
                            if(dataArr.result=="ok"){
                                Showbo.Msg.alert(dataArr.msg);
                            }else{
                                Showbo.Msg.alert(dataArr.msg);
                            }
                        },
                        error: function (data, status, e)
                        {
                            $("#wait_dialog").modal("hide");
                            //rcms.message("上传失败");
                        }
                    });
                }
            });
        }else{
            $("#bbfile").attr('style','float: left;width:300px;height: 28px;border:solid 1px red; border-radius:5px; resize:none;');
            Showbo.Msg.alert("请选择需要导入的文件！");
            return false;
        }
    };
    $('#passwordForm').submit(function(e){
        $('#errorMsg2').hide();
        var form = $(this);
        var data = form.serializeArray();
        var dataArr = {};
        for (var i = 0; i < data.length; i++) {
            dataArr[data[i].name] = data[i].value;
        }
        if(dataArr.pwd!=$('#new_pwd2').val()){
            $('#errorMsg2').text('两次密码输入不一致');
            $('#errorMsg2').show();
            return false;
        }
        Showbo.Msg.confirm('修改后将重新登录，是否确认修改？', function(btn){
            if(btn=="no"){
                return false;
            }else{
                $("#wait_dialog").modal("show");
                rcms.ajax({
                    type: 'post',
                    url: '/apis/set_pwd/',
                    data:JSON.stringify(dataArr)
                }).success(function (data) {
                    $("#wait_dialog").modal("hide");
                    if(data.result=='ok'){
                        rcms.message('密码修改成功');
                        location.href = '/login/';
                    }else{
                        rcms.message(data.msg);
                    }
                }).error(function(data){
                    $("#wait_dialog").modal("hide");
                    //rcms.message(data.msg);
                })
            }
        });
    });
    $('#div7').on('click',function(){
        $('#div8')[0].className=($('#div8')[0].className=="close2")?"open2":"close2";
        $('#div7')[0].className=($('#div7')[0].className=="close1")?"open1":"close1";
    });
    $('#resetTing_btn').on('click',function(){
        Showbo.Msg.confirm('是否恢复出厂设置？', function(btn){
            if(btn=="no"){
                return false;
            }else{
                $("#wait_dialog").modal("show");
                rcms.ajax({
                    type: 'post',
                    url: '/apis/reset_conf/'
                }).success(function (data) {
                    $("#wait_dialog").modal("hide");
                    if(data.result=='ok'){
                        Showbo.Msg.alert('设备正在恢复出厂设置，大约需要3分钟，请勿下电！');
                        location.href = '/login/';
                    }else{
                        Showbo.Msg.alert(data.msg);
                    }
                }).error(function (data) {
                    $("#wait_dialog").modal("hide");
                    //rcms.message(data.msg);
                })
            }
        });
    });
    var timeGo = 120;
    var timeLoad=function(){
        if(timeGo==0){
            $('#reloadMsg_dialog').modal('hide');
            location.href = '/login/';
        }else{
            $('#timeLoad').text(timeGo);
            timeGo=timeGo-1;
            $timeout(timeLoad,1000);
        }
    };
    $('#reload_btn').on('click',function(){
        Showbo.Msg.confirm('是否重启设备？', function(btn){
            if(btn=="no"){
                return false;
            }else{
                rcms.ajax({
                    type: 'post',
                    url: '/apis/reboot/'
                }).success(function (data) {
                    if(data.result=='ok'){
                        $('#reloadMsg_dialog').modal('show');
                        timeLoad();
                    }else{
                        rcms.message(data.msg);
                    }
                }).error(function (data) {
                    //rcms.message(data.msg);
                })
            }
        });
    });
    $('#getlogs_btn').on('click',function(){
        var url = location.href.split('/')[2];
        window.open("http://"+url+"/apis/get_logs/");
    });

    $('#setPort_btn').on('click',function(){
        var numberCheck=/^[0-9]+$/;
        $scope.webport=$('#port').val();
        if(!numberCheck.test($scope.webport)){
            Showbo.Msg.alert('端口号应为数字端口，如：8080');
            return false;
        }

        Showbo.Msg.confirm('<div>修改后将重新登录，是否确认修改？<br>(Online远程登录需重新从Online远程登录)</div>', function(btn) {
            if (btn == "no") {
                return false;
            } else {
                $("#wait_dialog").modal("show");
                rcms.ajax({
                    type: 'post',
                    url: '/apis/set_webport/',
                    data:JSON.stringify({webport:$scope.webport})
                }).success(function (data) {
                    $("#wait_dialog").modal("hide");
                    if(data.result=='ok'){
                        var urlAttr=window.location.href.split(':');
                        if(urlAttr.length>2){
                            window.location.href=urlAttr[0]+':'+urlAttr[1]+':'+$scope.webport+'/login/';
                        }else{
                            var urlAttr2=window.location.href.split('/#');
                            window.location.href=urlAttr2[0]+':'+$scope.webport+'/login/';
                        }
                    }else{
                        rcms.message(data.msg);
                    }
                }).error(function (data) {
                    $("#wait_dialog").modal("hide");
                    //rcms.message(data.msg);
                })
            }
        });
    });
    rcms.ajax({
        type: 'post',
        url: '/apis/get_webport/'
    }).success(function (data) {
        if(data.result=='ok'){
            $('#port').val(data.webport);
        }else{
            rcms.message(data.msg);
        }
    });
    $('#edit_license').on('click',function(){
        var reg=/\s*\S+/;
        var addr=$('#addr').val();
        if(!reg.test(addr)){
            Showbo.Msg.alert("地址不能为空！");
            return false;
        }
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({lic:{addr:addr}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message("修改成功！");
            }else{
                rcms.message(data.msg);
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        });
    });
    rcms.ajax({
        type: 'post',
        url: '/apis/conf/get_conf/',
        data:JSON.stringify({conf_name:'lic'})
    }).success(function (data) {
        $("#wait_dialog").modal("hide");
        if(data.result=='ok'){
            $('#addr').val(data.data.addr);
        }else{
            rcms.message(data.msg);
        }
    }).error(function (data) {
        $("#wait_dialog").modal("hide");
        //rcms.message(data.msg);
    });
});
myApp.controller('netCkeck', function ($scope, Data,$timeout) {
    var timer;
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='';
    $('#div11').on('click',function(){
        var enable=0;
        if($('#div12')[0].className=='open2'){
            enable=0;
        }else{
            enable=1;
        }
        $("#wait_dialog").modal("show");
        var count=0;
        function output_number() {
            count++;
            if(count==30){
                $("#wait_dialog").modal("hide");
                clearInterval(timer);
            }
        }
        timer=setInterval(function() {output_number();}, 1000);
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({audit:{enable:enable}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                $('#div12')[0].className=($('#div12')[0].className=="close2")?"open2":"close2";
                $('#div11')[0].className=($('#div11')[0].className=="close1")?"open1":"close1";
                if(enable==1){
                    rcms.message('开启成功');
                }else{
                    rcms.message('关闭成功');
                }
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            //rcms.message(data.msg);
            $("#wait_dialog").modal("hide");
        })
    });
    rcms.ajax({
        type: 'post',
        url: '/apis/conf/get_conf/',
        data:JSON.stringify({conf_name:"audit"})
    }).success(function (data) {
        $("#wait_dialog").modal("hide");
        if(data.result=='ok'){
            if(data.data.enable==1){
                $('#div12')[0].className =  "open2";
                $('#div11')[0].className="open1";
            }else{
                $('#div12')[0].className =  "close2";
                $('#div11')[0].className="close1";
            }
        }else{
            rcms.message(data.msg);
        }
    }).error(function(data){
        $("#wait_dialog").modal("hide");
        //rcms.message(data.msg);
    });
    $scope.$on("$destroy",function(){
        if(timer){
            clearInterval(timer);
        }
    });
});
myApp.controller('portmap', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/portmap';
    $scope.portmapTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "portmapTab",
        isAutoResized: false,
        columns: [{
            caption: "映射关系",
            name: "type",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='nat'){
                    option='端口映射';
                }else{
                    option='整机映射';
                }
                return option;
            }
        },{
            caption: "内网IP",
            name: "lan_ip"
        },{
            caption: "内网端口",
            name: "lan_port"
        },{
            caption: "外网端口",
            name: "wan_port"
        },{
            caption: "协议类型",
            name: "protocol"
        },{
            caption: "接口",
            name: "value"
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            if(rowData.type=='nat'){
                                $scope.nat=false;
                                $scope.natSelect=true;
                                $scope.interfaceData=$scope.natlist;
                            }else{
                                $scope.nat=true;
                                $scope.interfaceData=$scope.dmzlist;
                                $scope.interfaceData.push({name:rowData.wan_net,value:rowData.value});
                            }
                            setTimeout(function() {
                                $scope.$apply(function (e) {
                                    $scope.portmapData = rowData;
                                })
                            },10)
                        })
                    },10);
                    $('#portmap_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除规则吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            $scope.portmapData = rowData;
                            for(var i=0;i<$scope.portmap.length;i++){
                                if($scope.portmap[i].id==$scope.portmapData.id){
                                    $scope.portmap.splice(i,1);
                                }
                            }
                            $scope.conf_set('portmap');
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:["ddns","netserver"]})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $("#wait_dialog").modal("hide");
                        $scope.ddns=data.data.ddns;
                        $scope.dmz={enable:true,ip:'192.168.1.1'};
                        $scope.portmap=data.data.netserver.netserver;
                        $scope.natlist=data.data.netserver.natlist;
                        $scope.dmzlist=data.data.netserver.dmzlist;
                        $scope.portmapTab.update($scope.portmap);
                        $('#div2')[0].className=($scope.ddns.enable)?"open2":"close2";
                        $('#div1')[0].className=($scope.ddns.enable)?"open1":"close1";
                        $('#div4')[0].className=($scope.dmz.enable)?"open2":"close2";
                        $('#div3')[0].className=($scope.dmz.enable)?"open1":"close1";
                        $scope.portmapTab.update($scope.portmap);
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };

    $('#div1').on('click',function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                if($('#div1')[0].className=="open1"){
                    $scope.ddns.enable=true;
                }else{
                    $scope.ddns.enable=false;
                }
            })
        },10);
        $('#div2')[0].className=($('#div2')[0].className=="close2")?"open2":"close2";
        $('#div1')[0].className=($('#div1')[0].className=="close1")?"open1":"close1";
    });
    $('#div3').on('click',function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                if($('#div3')[0].className=="open1"){
                    $scope.dmz.enable=true;
                }else{
                    $scope.dmz.enable=false;
                }
            })
        },10);
        $('#div4')[0].className=($('#div4')[0].className=="close2")?"open2":"close2";
        $('#div3')[0].className=($('#div3')[0].className=="close1")?"open1":"close1";
    });
    $scope.portmapAdd=function(){
        setTimeout(function(){
            $scope.$apply(function (e) {
                $scope.nat=false;
                $scope.natSelect=false;
                $scope.interfaceData=$scope.natlist;
                $scope.portmapData={type:'nat',protocol:'tcp'};
            })
        },10);
        $('#portmap_dialog').modal('show');
    };
    $scope.typeChange=function(type){
        if(type=='nat'){
            $scope.nat=false;
            $scope.interfaceData=$scope.natlist;
        }else{
            $scope.nat=true;
            $scope.interfaceData=$scope.dmzlist;
        }
    };
    $scope.conf_set=function(type ,del){
        var dataArr;
        switch(type)
        {
            case 'portmap':
                if(!del){
                    if($scope.interfaceData){
                        for(var i=0;i<$scope.interfaceData.length;i++){
                            if($scope.portmapData.type=='dmz'&&$scope.interfaceData[i].name==$scope.portmapData.wan_net&&$scope.portmapData.id){
                                $scope.interfaceData.splice(i,1);
                            }
                        }
                    }
                    if($scope.portmapData.id){
                        for(var j=0;j<$scope.portmap.length;j++){
                            if($scope.portmap[j].id==$scope.portmapData.id){
                                $scope.portmap[j]=$scope.portmapData;
                            }
                        }
                    }else{
                        $scope.portmap.push($scope.portmapData);
                    }
                }
                dataArr={netserver:{netserver:$scope.portmap}};
                break;
            case 'dmz':
                dataArr=$scope.dmz;
                break;
            case 'ddns':
                dataArr={ddns:$scope.ddns};
                break;
            default:
        }
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify(dataArr)
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            $('#portmap_dialog').modal('hide');
            if(data.result=='ok'){
                rcms.message('设置成功');
                $scope.get_conf();
            }else{
                Showbo.Msg.alert(data.msg);
                $scope.get_conf();
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //alert(data.msg);
        })
    };
    $scope.delPortmap=function(){
        if ($scope.portmapTab.getSelectedRows().length <= 0) {
            Showbo.Msg.alert("请选择要删除的项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var static_id = $scope.portmapTab.getSelectedRows();
                for (var d = 0; d < static_id.length; d++) {
                    for(var i=0;i<$scope.portmap.length;i++){
                        if($scope.portmap[i].id==static_id[d].id){
                            $scope.portmap.splice(i,1);
                        }
                    }
                }
                $scope.conf_set('portmap',true);
            }
        })
    };
    $scope.selectIp=function(){
        var leasesData=[];
        for(var i=0;i<$scope.portmap.length;i++){
            if($scope.portmap[i].lan_ip.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.portmap[i]);
            }
        }
        $scope.portmapTab.update(leasesData);
    };
    $scope.get_conf();
});
myApp.controller('antiAttack', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/antiAttack';
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'security',target:['Inlimit_enable','ping','web_port']})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $scope.antiAttack=data.data;
                        $scope.antiAttack.web_port=$scope.antiAttack.web_port=='80'?'':$scope.antiAttack.web_port;
                        $('#div6')[0].className=($scope.antiAttack.ping.lan=='1')?"open2":"close2";
                        $('#div5')[0].className=($scope.antiAttack.ping.lan=='1')?"open1":"close1";
                        $('#div8')[0].className=($scope.antiAttack.ping.wan=='1')?"open2":"close2";
                        $('#div7')[0].className=($scope.antiAttack.ping.wan=='1')?"open1":"close1";
                        $('#div4')[0].className=($scope.antiAttack.Inlimit_enable=='1')?"open2":"close2";
                        $('#div3')[0].className=($scope.antiAttack.Inlimit_enable=='1')?"open1":"close1";
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
        })
    };

    $('#div1,#div3,#div5,#div7').on('click',function() {
        var divNum = this.id.split('div')[1];
        setTimeout(function(){
            $scope.$apply(function(e){
                if (divNum == '5') {
                    if ($('#div6')[0].className == "open2") {
                        $scope.antiAttack.ping.lan='0';
                    } else {
                        $scope.antiAttack.ping.lan='1';
                    }
                }
                if (divNum == '7') {
                    if ($('#div8')[0].className == "open2") {
                        $scope.antiAttack.ping.wan='0';
                    } else {
                        $scope.antiAttack.ping.wan='1';
                    }
                }
                if (divNum == '3') {
                    if ($('#div4')[0].className == "open2") {
                        $scope.antiAttack.Inlimit_enable='0';
                    } else {
                        $scope.antiAttack.Inlimit_enable='1';
                    }
                }
                $('#div' + (parseInt(divNum) + 1).toString())[0].className = ($('#div' + (parseInt(divNum) + 1).toString())[0].className == "close2") ? "open2" : "close2";
                $('#div' + divNum)[0].className = ($('#div' + divNum)[0].className == "close1") ? "open1" : "close1";
            })
        },10)
    });
    $scope.conf_set=function(type){
        if(type){
            $scope.antiAttack={web_port: 80, ping: {wan: "0", "lan": "0"}, Inlimit_enable: "0"};
        }else{
            $scope.antiAttack.web_port=$scope.antiAttack.web_port==''?80:$scope.antiAttack.web_port;
        }
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({security:$scope.antiAttack})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                $scope.get_conf();
                rcms.message('设置成功');
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
        })
    };
    $scope.get_conf();
});
myApp.controller('arp', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/arp';
    $scope.arpListTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "arpListTab",
        isAutoResized: false,
        columns: [{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "MAC地址",
            name: "mac"
        },{
            caption: "类型",
            name: "status"
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'security',target:['arp']})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $scope.arpListData=data.data.arp;
                        $scope.arpListTab.update($scope.arpListData);
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.conf_set=function(type){
        if(type=='static'){
            $scope.arp.bind='1';
            $scope.arp.status='静态';
            $scope.arpListData.push($scope.arp);
        }
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({security:{arp:$scope.arpListData}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('设置成功');
                $('#arp_dialog').modal('hide');
                $scope.get_conf();
            }else{
                Showbo.Msg.alert(data.msg);
                $scope.get_conf();
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            $scope.get_conf();
            //rcms.message(data.msg);
        })
    };
    $scope.delSelectStatic=function(){
        if ($scope.arpListTab.getSelectedRows().length <= 0) {
            Showbo.Msg.alert("请选择要解绑的配置项");
            return false;
        }
        Showbo.Msg.confirm('确定要解绑选中配置项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var static_id = $scope.arpListTab.getSelectedRows();
                for (var d = 0; d < static_id.length; d++) {
                    for(var i=0;i<$scope.arpListData.length;i++){
                        if($scope.arpListData[i].ip==static_id[d].ip){
                            $scope.arpListData.splice(i,1);
                        }
                    }
                }
                $scope.conf_set();
            }
        })
    };
    $scope.changeSelectStatic=function(){
        if ($scope.arpListTab.getSelectedRows().length <= 0) {
            Showbo.Msg.alert("请选择要切换绑定类型的配置项");
            return false;
        }
        Showbo.Msg.confirm('确定要切换选中配置项为静态绑定？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var static_id = $scope.arpListTab.getSelectedRows();
                for (var d = 0; d < static_id.length; d++) {
                    for(var i=0;i<$scope.arpListData.length;i++){
                        if($scope.arpListData[i].ip==static_id[d].ip){
                            $scope.arpListData[i].bind='1';
                            $scope.arpListData[i].status='静态';
                        }
                    }
                }
                $scope.conf_set();
            }
        })
    };
    $scope.addConf=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $scope.arp={};
            })
        },10);
        $('#arp_dialog').modal('show');
    };
    $scope.selectIp=function(){
        var leasesData=[];
        for(var i=0;i<$scope.arpListData.length;i++){
            if($scope.arpListData[i].ip.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.arpListData[i]);
            }else if($scope.arpListData[i].mac.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.arpListData[i]);
            }
        }
        $scope.arpListTab.update(leasesData);
    };
    $scope.get_conf();
});
myApp.controller('acl', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/acl';
    $scope.aclListTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "aclListTab",
        isAutoResized: false,
        columns: [{
            caption: "优先级",
            name: "index",
            width:'5%'
        },{
            caption: "源IP",
            name: "s_ip"
        },{
            caption: "源端口",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(rowData.s_port_b=='any'||rowData.s_port_b==''){
                    option='any';
                }else if(rowData.s_port_e=='any'||rowData.s_port_e==''){
                    option=rowData.s_port_b;
                }else{
                    option=rowData.s_port_b+'--'+rowData.s_port_e;
                }
                return option;
            }
        },{
            caption: "访问控制",
            name: "control",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='allow'){
                    option='允许';
                }else{
                    option='禁止';
                }
                return option;
            }
        },{
            caption: "协议",
            name: "protocol"
        },{
            caption: "目的IP",
            name: "d_ip"
        },{
            caption: "目的端口",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(rowData.d_port_b=='any'||rowData.d_port_b==''){
                    option='any';
                }else if(rowData.d_port_e=='any'||rowData.d_port_e==''){
                    option=rowData.d_port_b;
                }else{
                    option=rowData.d_port_b+'--'+rowData.d_port_e;
                }
                return option;
            }
        },{
            caption: "生效时间",
            name: "time"
        },{
            caption: "状态",
            name: "active",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='1'){
                    option='生效';
                }else{
                    option='不生效';
                }
                return option;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">移动</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.aclListData = rowData;
                            $scope.portBoxHide = $scope.aclListData.protocol == 'ip' ? true : false;
                            $scope.s_ip_any = $scope.aclListData.s_ip == 'any' ? true : false;
                            $scope.d_ip_any = $scope.aclListData.d_ip == 'any' ? true : false;
                            $scope.s_port_any = $scope.aclListData.s_port_b == 'any' ? true : false;
                            $scope.d_port_any = $scope.aclListData.d_port_b == 'any' ? true : false;
                            $scope.aclListData.s_ip = $scope.aclListData.s_ip == 'any' ? '' : $scope.aclListData.s_ip;
                            $scope.aclListData.d_ip = $scope.aclListData.d_ip == 'any' ? '' : $scope.aclListData.d_ip;
                            $scope.aclListData.s_port_b = $scope.aclListData.s_port_b == 'any' ? '' : $scope.aclListData.s_port_b;
                            $scope.aclListData.s_port_e = $scope.aclListData.s_port_e == 'any' ? '' : $scope.aclListData.s_port_e;
                            $scope.aclListData.d_port_b = $scope.aclListData.d_port_b == 'any' ? '' : $scope.aclListData.d_port_b;
                            $scope.aclListData.d_port_e = $scope.aclListData.d_port_e == 'any' ? '' : $scope.aclListData.d_port_e;
                            $('#div1')[0].className = ($scope.aclListData.active=='1') ? "open1" : "close1";
                            $('#div2')[0].className = ($scope.aclListData.active=='0') ? "open2" : "close2";
                        })
                    },10);
                    $('#acl_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    setTimeout(function() {
                        $scope.$apply(function (e) {
                            $scope.index='';
                            $scope.aclListData = rowData;
                        })
                    });
                    $('#indexChange_dialog').modal('show');
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.timeListTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "timeListTab",
        isAutoResized: false,
        columns: [{
            caption: "时间对象",
            name: "name"
        },{
            caption: "时间周期",
            name: "weekdays",
            formater:function(rowIndex, value, rowData){
                var option='';
                var weekdayArr=[];
                if(rowData.weekdays!='EveryDay'){
                    weekdayArr=rowData.weekdays.split(',');
                    for(var i=0;i<weekdayArr.length;i++){
                        if(weekdayArr[i]=='1'){
                            weekdayArr[i]='星期一';
                        }else if(weekdayArr[i]=='2'){
                            weekdayArr[i]='星期二';
                        }else if(weekdayArr[i]=='3'){
                            weekdayArr[i]='星期三';
                        }else if(weekdayArr[i]=='4'){
                            weekdayArr[i]='星期四';
                        }else if(weekdayArr[i]=='5'){
                            weekdayArr[i]='星期五';
                        }else if(weekdayArr[i]=='6'){
                            weekdayArr[i]='星期六';
                        }else if(weekdayArr[i]=='7'){
                            weekdayArr[i]='星期日';
                        }
                    }
                    option=weekdayArr.join(';');
                }else{
                    option='每天';
                }
                return option;
            }
        },{
            caption: "时间段",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option='';
                for(var i=0;i<rowData.clock.length;i++){
                    option=option+'  '+rowData.clock[i];
                }
                return option;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.nameChange=true;
                            $scope.timeData=rowData;
                            $scope.timeStart=rowData.clock[0].split('-')[0];
                            $scope.timeEnd=rowData.clock[0].split('-')[1];
                            $scope.timeRange=$scope.timeData.weekdays;
                            $scope.selectTable($scope.timeData);
                        })
                    },10);
                    $('#timeEdit_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    if(rowData.used.length>0){
                        Showbo.Msg.alert('时间对象'+rowData.name+'已被'+rowData.used[0]+'使用无法进行删除！');
                        return false;
                    }
                    Showbo.Msg.confirm('确定要删除时间对象'+rowData.name+'吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            setTimeout(function() {
                                $scope.$apply(function (e) {
                                    $scope.timeData=rowData;
                                    for(var i=0;i<$scope.time_classData.length;i++){
                                        if($scope.timeData.id==$scope.time_classData[i].id){
                                            $scope.time_classData.splice(i,1);
                                        }
                                    }
                                    $scope.setTimeConf();
                                })
                            });
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'security',target:['acl']})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $scope.aclList=data.data.acl;
                        $scope.time_class=data.data.time_class;
                        $scope.selectTable();
                        $scope.aclListTab.update($scope.aclList);
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.getTimeConf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'time_class'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $scope.time_classData=data.data.time;
                        $scope.timeListTab.update($scope.time_classData);
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.setTimeConf = function () {
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data: JSON.stringify({time_class: {time: $scope.time_classData}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if (data.result == 'ok') {
                rcms.message('设置成功');
                $('#timeEdit_dialog').modal('hide');
                $scope.getTimeConf();
                $scope.get_conf();
            } else {
                $scope.getTimeConf();
                Showbo.Msg.alert(data.msg);
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.timeDel=function(){
        if ($scope.timeListTab.getSelectedRows().length <= 0) {
            Showbo.Msg.alert("请选择要删除的项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var static_id = $scope.timeListTab.getSelectedRows();
                for(var d = 0; d < static_id.length; d++){
                    if(static_id[d].used.length>0){
                        Showbo.Msg.alert('时间对象'+static_id[d].name+'已被'+static_id[d].used[0]+'使用无法进行删除！');
                        return false;
                    }
                }
                for (var d = 0; d < static_id.length; d++) {
                    for(var i=0;i<$scope.time_classData.length;i++){
                        if($scope.time_classData[i].id==static_id[d].id){
                            $scope.time_classData.splice(i,1);
                        }
                    }
                }
                $scope.setTimeConf();
            }
        })
    };
    $scope.timeAdd=function(){
        setTimeout(function() {
            $scope.$apply(function (e) {
                $scope.nameChange=false;
                $scope.timeData = {};
                $scope.timeStart='00:00';
                $scope.timeEnd='23:59';
                $scope.selectTable(true);
            })
        },10);
        $('#timeEdit_dialog').modal('show');
    };
    $scope.timeControl=function(){
        $("#timeControl_dialog").modal("show");
    };
    $scope.setTimeEdit=function(){
        var weekdayArr=$('#timeSel .select_rel').val().split(';');
        for(var i=0;i<weekdayArr.length;i++){
            if(weekdayArr[i]=='星期一'){
                weekdayArr[i]='1';
            }else if(weekdayArr[i]=='星期二'){
                weekdayArr[i]='2';
            }else if(weekdayArr[i]=='星期三'){
                weekdayArr[i]='3';
            }else if(weekdayArr[i]=='星期四'){
                weekdayArr[i]='4';
            }else if(weekdayArr[i]=='星期五'){
                weekdayArr[i]='5';
            }else if(weekdayArr[i]=='星期六'){
                weekdayArr[i]='6';
            }else if(weekdayArr[i]=='星期日'){
                weekdayArr[i]='7';
            }
        }
        var option=weekdayArr.join(',');
        $scope.timeData.weekdays=option;
        $scope.timeData.clock=[$scope.timeStart+'-'+$scope.timeEnd];
        if($scope.timeData.id){
            for(var j=0;j<$scope.time_classData.length;j++){
                if($scope.time_classData[j].id==$scope.timeData.id){
                    $scope.time_classData[j]=$scope.timeData;
                }
            }
        }else{
            for(var k=0;k<$scope.time_classData.length;k++){
                if($scope.time_classData[k].name==$scope.timeData.name){
                    Showbo.Msg.alert('时间对象'+$scope.timeData.name+'已存在,请重新输入');
                    return false
                }
            }
            $scope.time_classData.push($scope.timeData)
        }
        $scope.setTimeConf();
    };
    $scope.selectTable=function (data,change){
        $('#timeSel').html('');
        $('#timeSel').MSDL({
            'width': '185',
            'data': ['星期日','星期六','星期五','星期四','星期三','星期二','星期一']
        });
        var weekdayArr=[];
        if(data&&!change){
            if(data.weekdays){
                if(data.weekdays=='EveryDay'){
                    weekdayArr=['星期一','星期二','星期三','星期四','星期五','星期六','星期日']
                }else{
                    weekdayArr=data.weekdays.split(',');
                }
                for(var i=0;i<weekdayArr.length;i++){
                    if(weekdayArr[i]=='1'){
                        weekdayArr[i]='星期一';
                    }else if(weekdayArr[i]=='2'){
                        weekdayArr[i]='星期二';
                    }else if(weekdayArr[i]=='3'){
                        weekdayArr[i]='星期三';
                    }else if(weekdayArr[i]=='4'){
                        weekdayArr[i]='星期四';
                    }else if(weekdayArr[i]=='5'){
                        weekdayArr[i]='星期五';
                    }else if(weekdayArr[i]=='6'){
                        weekdayArr[i]='星期六';
                    }else if(weekdayArr[i]=='7'){
                        weekdayArr[i]='星期日';
                    }
                    $("input[value="+weekdayArr[i]+"]")[0].checked=true
                }
                var option=weekdayArr.join(';');
                $('#timeSel .select_rel').val(option);
            }
        }else{
            $('#objectSel .select_rel').val('');
        }
    };
    $scope.getTimeConf();
    $scope.protocolChange=function(protocol){
        setTimeout(function() {
            $scope.$apply(function (e) {
                if (protocol == "ip") {
                    $scope.portBoxHide = true;
                } else {
                    $scope.portBoxHide = false;
                }
            })
        })
    };
    $scope.aclAdd=function(){
        setTimeout(function(){
            $scope.$apply(function (e) {
                $scope.aclListData = {
                    active: "0",
                    control: "forbid",
                    d_ip: "",
                    d_ip_type: "ip",
                    d_mask: "255.255.255.255",
                    d_port_b: '',
                    d_port_e: '',
                    protocol: "tcp",
                    s_ip: "",
                    s_ip_type: "ip",
                    s_mask: "255.255.255.255",
                    s_port_b: '',
                    s_port_e: "",
                    time: ""
                };
                $scope.portBoxHide = true;
                $scope.s_ip_any =true;
                $scope.d_ip_any =true;
                $scope.s_port_any =true;
                $scope.d_port_any =true;
                $('#div2')[0].className = "close2";
                $('#div1')[0].className = "close1";
            })
        },10);
        $('#acl_dialog').modal('show');
    };
    $scope.edit_conf_set=function(){
        $scope.aclListData.s_ip= $scope.s_ip_any  == true ? 'any' : $scope.aclListData.s_ip;
        $scope.aclListData.s_mask= $scope.s_ip_any  == true ? '255.255.255.255' :($scope.s_type=='ip'?'255.255.255.255':$scope.aclListData.s_mask);
        $scope.aclListData.d_ip = $scope.d_ip_any== true? 'any' : $scope.aclListData.d_ip;
        $scope.aclListData.d_mask= $scope.d_ip_any  == true ? '255.255.255.255' :($scope.d_type=='ip'?'255.255.255.255':$scope.aclListData.d_mask);
        $scope.aclListData.s_port_b = $scope.s_port_any == true ? 'any' : $scope.aclListData.s_port_b;
        $scope.aclListData.s_port_e = $scope.s_port_any == true ? 'any' : $scope.aclListData.s_port_e;
        $scope.aclListData.d_port_b = $scope.d_port_any== true ? 'any' : $scope.aclListData.d_port_b;
        $scope.aclListData.d_port_e = $scope.d_port_any== true ? 'any' : $scope.aclListData.d_port_e;
        $scope.aclListData.active=$('#div1')[0].className=='open1'?'1':'0';
        if($scope.aclListData.index){
            for(var i=0;i<$scope.aclList.length;i++){
                if($scope.aclList[i].index==$scope.aclListData.index){
                    $scope.aclList[i]=$scope.aclListData;
                }
            }
        }else{
            $scope.aclListData.index=$scope.aclList.length+1;
            $scope.aclList.push($scope.aclListData);
        }
        $scope.conf_set();
    };
    $scope.aclDel=function(){
        if ($scope.aclListTab.getSelectedRows().length <= 0) {
            Showbo.Msg.alert("请选择要删除的项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var static_id = $scope.aclListTab.getSelectedRows();
                for (var d = 0; d < static_id.length; d++) {
                    for(var i=0;i<$scope.aclList.length;i++){
                        if($scope.aclList[i].index==static_id[d].index){
                            $scope.aclList.splice(i,1);
                        }
                    }
                }
                for(var j=0;j<$scope.aclList.length;j++){
                    $scope.aclList[j].index=j+1;
                }
                $scope.conf_set();
            }
        })
    };
    $scope.changeIndex=function(){
        var aclListArr=[];
        if($scope.index>$scope.aclList.length||$scope.index==$scope.aclListData.index){
            Showbo.Msg.alert('不在可移动的范围内，请重新输入');
            return false;
        }
        var static_id = $scope.aclListTab.gridData;
        for(var i=0;i<static_id.length;i++){
            if(static_id[i].index==$scope.aclListData.index){
                static_id.splice(i,1);
            }
        }
        for(var i=0;i<static_id.length;i++){
            static_id[i].index=i+1;
        }
        for(var i=0;i<static_id.length;i++){
            if(static_id[i].index<$scope.index){
                aclListArr.push(static_id[i]);
            }else{
                static_id[i].index=static_id[i].index+1;
                aclListArr.push(static_id[i]);
            }
        }
        $scope.aclListData.index=$scope.index;
        aclListArr.push($scope.aclListData);
        $scope.aclList=aclListArr;
        $scope.conf_set();
    };
    $scope.conf_set=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({security:{acl:$scope.aclList}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('设置成功');
                $scope.get_conf();
                $('#acl_dialog').modal('hide');
                $('#indexChange_dialog').modal('hide');
            }else{
                Showbo.Msg.alert(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
        })
    };
    $('#div1').on('click',function() {
        var divNum = this.id.split('div')[1];
        if (divNum == '1') {
            if ($('#div2')[0].className == "open2") {
                $scope.aclListData.active='0';
            } else {
                $scope.aclListData.active='1';
            }
        }
        $('#div' + (parseInt(divNum) + 1).toString())[0].className = ($('#div' + (parseInt(divNum) + 1).toString())[0].className == "close2") ? "open2" : "close2";
        $('#div' + divNum)[0].className = ($('#div' + divNum)[0].className == "close1") ? "open1" : "close1";
    });
    $scope.get_conf();
});
myApp.controller('linkNum', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/linkNum';
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'security',target:['connlimit']})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $scope.linkNum={};
                        $scope.connlimit=data.data.connlimit;
                        for(var i=0;i<$scope.connlimit.length;i++){
                            if($scope.connlimit[i].name=="max_net"){
                                $scope.linkNum.max_net=$scope.connlimit[i].above;
                                $scope.linkNum.max_net_enable=($scope.connlimit[i].enable=='0')?true:false;
                                $('#div1')[0].className=($scope.connlimit[i].enable=='1')?"open1":"close1";
                                $('#div2')[0].className=($scope.connlimit[i].enable=='1')?"open2":"close2";
                            }else if($scope.connlimit[i].name=="max_ip"){
                                $scope.linkNum.max_ip=$scope.connlimit[i].above;
                                $scope.linkNum.max_ip_enable=($scope.connlimit[i].enable=='0')?true:false;
                                $('#div3')[0].className=($scope.connlimit[i].enable=='1')?"open1":"close1";
                                $('#div4')[0].className=($scope.connlimit[i].enable=='1')?"open2":"close2";
                            }
                        }
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
        })
    };
    $scope.set_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({security:{connlimit:$scope.connlimit}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('设置成功');
            }else{
                Showbo.Msg.alert(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
        })
    };
    $('#div1,#div3').on('click',function() {
        var divNum = this.id.split('div')[1];
        setTimeout(function(){
            $scope.$apply(function(e){
                if (divNum == '1') {
                    for(var i=0;i<$scope.connlimit.length;i++){
                        if($scope.connlimit[i].name=='max_net'){
                            if ($('#div2')[0].className == "open2") {
                                $scope.connlimit[i].enable='1';
                            } else {
                                $scope.connlimit[i].enable='0';
                            }
                            $scope.linkNum.max_net_enable=($scope.connlimit[i].enable=='0')?true:false;
                        }
                    }
                }
                if (divNum == '3') {
                    for(var i=0;i<$scope.connlimit.length;i++){
                        if($scope.connlimit[i].name=='max_ip'){
                            if ($('#div4')[0].className == "open2") {
                                $scope.connlimit[i].enable='1';
                            } else {
                                $scope.connlimit[i].enable='0';
                            }
                            $scope.linkNum.max_ip_enable=($scope.connlimit[i].enable=='0')?true:false;
                        }
                    }
                }
            })
        },10);
        $('#div' + (parseInt(divNum) + 1).toString())[0].className = ($('#div' + (parseInt(divNum) + 1).toString())[0].className == "close2") ? "open2" : "close2";
        $('#div' + divNum)[0].className = ($('#div' + divNum)[0].className == "close1") ? "open1" : "close1";
    });
    $scope.maxChange=function(type){
        for(var i=0;i<$scope.connlimit.length;i++) {
            if (type == $scope.connlimit[i].name) {
                $scope.connlimit[i].above=$scope.linkNum[type];
            }
        }
    };
    $scope.get_conf();
});
myApp.controller('networkAcCtrl', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/networkAcCtrl';
    $scope.networkAcCtrlListTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "networkAcCtrlListTab",
        isAutoResized: false,
        columns: [{
            caption: "类型",
            name: "type",
            formater:function(rowIndex, value, rowData){
                var option='';
                if(value=='ip'){
                    option='IP地址';
                }else if(value=='mac'){
                    option='MAC地址';
                }else if(value=='domain'){
                    option='域名地址';
                }else{
                    option=value;
                }
                return option;
            }
        },{
            caption: "对象",
            name: "",
            formater:function(rowIndex, value, rowData){
                var opration='';
                for(var i=0;i<rowData.object.length;i++){
                    opration=opration+" "+rowData.object[i];
                }
                return opration;
            }
        },{
            caption: "禁止/允许",
            name: "ctrl",
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(value=='allow'){
                    opration='允许';
                }else{
                    opration='禁止';
                }
                return opration;
            }
        },{
            caption: "接口",
            name: "",
            formater:function(rowIndex, value, rowData){
                var opration='';
                for(var i=0;i<rowData.net.length;i++){
                    for(var j=0;j<$scope.interface_listName.length;j++){
                        if(rowData.net[i]==$scope.interface_listName[j]){
                            opration=opration+" "+$scope.interface_listValue[j];
                        }
                    }
                }
                return opration;
            }
        },{
            caption: "状态",
            name: "active",
            formater:function(rowIndex, value, rowData){
                var opration='';
                if(value=='1'){
                    opration='开启';
                }else{
                    opration='关闭';
                }
                return opration;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            if(rowData.type=='ip'){
                                $scope.object_listName=$scope.object_list.ip_class;
                            }else if(rowData.type=='mac'){
                                $scope.object_listName=$scope.object_list.mac_class;
                            }else if(rowData.type=='domain'){
                                $scope.object_listName=$scope.object_list.domain_class;
                            }else if(rowData.type=='time'){
                                $scope.object_listName=$scope.object_list.time_class;
                            }
                            $scope.networkAcCtrl=rowData;
                            $scope.interface_listName=[];
                            $scope.interface_listValue=[];
                            for(var i=0;i<$scope.bridges.length;i++){
                                $scope.interface_listName.push($scope.bridges[i].name);
                                $scope.interface_listValue.push($scope.bridges[i].value);
                            }
                            $scope.selectTable($scope.networkAcCtrl);
                            $scope.selectTable2($scope.networkAcCtrl);
                            $('#div4')[0].className=($scope.networkAcCtrl.active=='1')?"open2":"close2";
                            $('#div3')[0].className=($scope.networkAcCtrl.active=='1')?"open1":"close1";
                        })
                    },10);
                    $('#networkAcCtrl_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除规则吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            $scope.networkAcCtrl=rowData;
                            $scope.conf_set('single');
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.selectTable=function (data,change){
        $('#objectSel').html('');
        $('#objectSel').MSDL({
            'width': '185',
            'data': $scope.object_listName
        });
        var option='';
        if(data&&!change){
            if(data.object){
                for(var i=0;i<data.object.length;i++){
                    if(i>0){
                        option=option+";"+data.object[i]
                    }else{
                        option=option+data.object[i]
                    }
                    $("input[value="+data.object[i]+"]")[0].checked=true
                }
                $('#objectSel .select_rel').val(option);
            }
        }else{
            $('#objectSel .select_rel').val('');
        }
    };
    $scope.selectTable2=function (data){
        $('#interfaceSel').html('');
        $('#interfaceSel').MSDL({
            'width': '185',
            'data': $scope.interface_listValue
        });
        var option='';
        if(data){
            if(data.net){
                for(var i=0;i<data.net.length;i++){
                    for(var j=0;j<$scope.interface_listName.length;j++){
                        if(data.net[i]==$scope.interface_listName[j]){
                            if(i>0){
                                option=option+";"+$scope.interface_listValue[j]
                            }else{
                                option=option+$scope.interface_listValue[j]
                            }
                            $("input[value="+$scope.interface_listValue[j]+"]")[0].checked=true
                        }
                    }
                }
                $('#interfaceSel .select_rel').val(option);
            }
        }else{
            $('#interfaceSel .select_rel').val('');
        }
    };
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'security',target:['out_ctrl']})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $scope.out_ctrl=data.data.out_ctrl;
                        $scope.bridges=data.data.bridges;
                        $scope.object_list=data.data.object_list;
                        $scope.object_listName=$scope.object_list.ip_class;
                        $scope.interface_listName=[];
                        $scope.interface_listValue=[];
                        for(var i=0;i<$scope.bridges.length;i++){
                            $scope.interface_listName.push($scope.bridges[i].name);
                            $scope.interface_listValue.push($scope.bridges[i].value);
                        }
                        $scope.selectTable();
                        $scope.selectTable2();
                        $scope.networkAcCtrlListTab.update($scope.out_ctrl)
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.changeType=function(type){
        if(type=='ip'){
            $scope.object_listName=$scope.object_list.ip_class;
        }else if(type=='mac'){
            $scope.object_listName=$scope.object_list.mac_class;
        }else if(type=='time'){
            $scope.object_listName=$scope.object_list.time_class;
        }else if(type=='domain'){
            $scope.object_listName=$scope.object_list.domain_class;
        }
        $scope.selectTable($scope.networkAcCtrl,true);
    };
    $('#div3').on('click',function() {
        var divNum = this.id.split('div')[1];
        if (divNum == '3') {
            if ($('#div4')[0].className == "open2") {
                $scope.networkAcCtrl.active='0';
            } else {
                $scope.networkAcCtrl.active='1';
            }
        }
        $('#div' + (parseInt(divNum) + 1).toString())[0].className = ($('#div' + (parseInt(divNum) + 1).toString())[0].className == "close2") ? "open2" : "close2";
        $('#div' + divNum)[0].className = ($('#div' + divNum)[0].className == "close1") ? "open1" : "close1";
    });
    $scope.networkAcCtrlAdd=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $('#div4')[0].className="close2";
                $('#div3')[0].className="close1";
                $scope.object_listName=$scope.object_list.ip_class;
                $scope.selectTable();
                $scope.selectTable2();
                $scope.networkAcCtrl={type:'ip',ctrl:'allow'};
                $('#networkAcCtrl_dialog').modal('show');
            })
        },10)
    };
    $scope.networkAcCtrlDel=function(){
        if ($scope.networkAcCtrlListTab.getSelectedRows().length <= 0) {
            Showbo.Msg.alert("请选择要删除的项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                $scope.conf_set('many');
            }
        })
    };
    $scope.conf_set=function(type){
        if(type=='single'){
            for(var i=0;i<$scope.out_ctrl.length;i++){
                if($scope.networkAcCtrl.id==$scope.out_ctrl[i].id){
                    $scope.out_ctrl.splice(i,1);
                }
            }
        }else if(type=='many'){
            var static_id = $scope.networkAcCtrlListTab.getSelectedRows();
            for (var d = 0; d < static_id.length; d++) {
                for(var i=0;i<$scope.out_ctrl.length;i++){
                    if($scope.out_ctrl[i].id==static_id[d].id){
                        $scope.out_ctrl.splice(i,1);
                    }
                }
            }
        }else{
            $scope.networkAcCtrl.object=$('#objectSel .select_rel').val().split(';')[0]==''?[]:$('#objectSel .select_rel').val().split(';');
            $scope.networkAcCtrl.net=$('#interfaceSel .select_rel').val().split(';')[0]==''?[]:$('#interfaceSel .select_rel').val().split(';');
            for(var j=0;j<$scope.networkAcCtrl.net.length;j++){
                for(var k=0;k<$scope.interface_listValue.length;k++){
                    if($scope.networkAcCtrl.net[j]==$scope.interface_listValue[k]){
                        $scope.networkAcCtrl.net[j]=$scope.interface_listName[k]
                    }
                }
            }
            $scope.networkAcCtrl.active = $('#div4')[0].className=="open2"?'1':'0';
            if(!$scope.networkAcCtrl.id){
                $scope.out_ctrl.push($scope.networkAcCtrl)
            }else{
                for(var i=0;i<$scope.out_ctrl.length;i++){
                    if($scope.networkAcCtrl.id==$scope.out_ctrl[i].id){
                        $scope.out_ctrl[i]=$scope.networkAcCtrl;
                    }
                }
            }
        }
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({security:{out_ctrl:$scope.out_ctrl}})
        }).success(function (data) {
            if(data.result=='ok'){
                rcms.message('设置成功');
                $('#networkAcCtrl_dialog').modal('hide');
                $scope.get_conf();
            }else{
                Showbo.Msg.alert(data.msg);
                $scope.get_conf();
            }
        })
    };
    $scope.get_conf();
});
myApp.controller('control', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/control';
    $scope.controlTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "controlTab",
        isAutoResized: false,
        columns: [{
            caption: "网络名称",
            name: "name"
        },{
            caption: "上行流量限制（Mbps）",
            name: "upRate"
        },{
            caption: "下行流量限制（Mbps）",
            name: "downRate"
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.portmapData=rowData;
                        })
                    },10);
                    $('#portmap_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除规则吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.get_conf=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $("#wait_dialog").modal("hide");
            })
        },10);
        //rcms.ajax({
        //    type: 'post',
        //    url: '/apis/conf/get_conf/',
        //    data:JSON.stringify({conf_name:'control'})
        //}).success(function (data) {
        //    $("#wait_dialog").modal("hide");
        //    if(data.result=='ok'){
        //        window.sessionStorage.network=JSON.stringify(data.data);
        //        $scope.network=data.data;
        //        for(var j=0;j<3;j++){
        //            $("#dns"+j).val("");
        //        }
        //        for(var i=0;i<$scope.network.dns_addr.length;i++){
        //            $("#dns"+i).val($scope.network.dns_addr[i]);
        //        }
        //    }else{
        //        rcms.message(data.msg);
        //    }
        //}).error(function(data){
        //    $("#wait_dialog").modal("hide");
        //    //rcms.message(data.msg);
        //})
    };

    $('#div1,#div3').on('click',function() {
        var divNum = this.id.split('div')[1];
        if (divNum == '5') {
            if ($('#div6')[0].className == "open2") {
                $('#webAuthLost').hide();
            } else {
                $('#webAuthLost').show();
            }
        }
        if (divNum == '1') {
            if ($('#div2')[0].className == "open2") {
                $('#webAuthForm').hide();
            } else {
                $('#webAuthForm').show();
            }
        }
        if (divNum == '3') {
            if ($('#div4')[0].className == "open2") {
                $('#webLostForm').hide();
            } else {
                $('#webLostForm').show();
            }
        }
        $('#div' + (parseInt(divNum) + 1).toString())[0].className = ($('#div' + (parseInt(divNum) + 1).toString())[0].className == "close2") ? "open2" : "close2";
        $('#div' + divNum)[0].className = ($('#div' + divNum)[0].className == "close1") ? "open1" : "close1";
    });
    $scope.portmapAdd=function(){
        setTimeout(function(){
            $scope.$apply(function (e) {
                $scope.portmapData={};
                $scope.portmapData.pr_protype='tcp';
            })
        },10);
        $('#portmap_dialog').modal('show');
    };
    $('#ddnsSub').submit(function(){
        $("#wait_dialog").modal("show");
        //rcms.ajax({
        //    type: 'post',
        //    url: '/apis/conf/set_conf/',
        //    data:JSON.stringify({network:{dns_addr:$scope.network.dns_addr}})
        //}).success(function (data) {
        //    $("#wait_dialog").modal("hide");
        //    if(data.result=='ok'){
        //        rcms.message('设置成功');
        //    }else{
        //        rcms.message(data.msg);
        //        $scope.get_conf();
        //    }
        //}).error(function(data){
        //    $("#wait_dialog").modal("hide");
        //    //alert(data.msg);
        //})
    });
    $scope.get_conf();
});
myApp.controller('packetManagement', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/packetManagement';
    $scope.timeListTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "timeListTab",
        isAutoResized: false,
        columns: [{
            caption: "时间对象",
            name: "name"
        },{
            caption: "时间周期",
            name: "weekdays",
            formater:function(rowIndex, value, rowData){
                var option='';
                var weekdayArr=[];
                if(rowData.weekdays!='EveryDay'){
                    weekdayArr=rowData.weekdays.split(',');
                    for(var i=0;i<weekdayArr.length;i++){
                        if(weekdayArr[i]=='1'){
                            weekdayArr[i]='星期一';
                        }else if(weekdayArr[i]=='2'){
                            weekdayArr[i]='星期二';
                        }else if(weekdayArr[i]=='3'){
                            weekdayArr[i]='星期三';
                        }else if(weekdayArr[i]=='4'){
                            weekdayArr[i]='星期四';
                        }else if(weekdayArr[i]=='5'){
                            weekdayArr[i]='星期五';
                        }else if(weekdayArr[i]=='6'){
                            weekdayArr[i]='星期六';
                        }else if(weekdayArr[i]=='7'){
                            weekdayArr[i]='星期日';
                        }
                    }
                    option=weekdayArr.join(';');
                }else{
                    option='每天';
                }
                return option;
            }
        },{
            caption: "时间段",
            name: "",
            width:'15%',
            formater:function(rowIndex, value, rowData){
                var option='';
                for(var i=0;i<rowData.clock.length;i++){
                    option=option+'  '+rowData.clock[i];
                }
                return option;
            }
        },{
            caption:"操作",
            name:'',
            width:'15%',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.nameChange=true;
                            $scope.timeData=rowData;
                            $scope.timeStart=rowData.clock[0].split('-')[0];
                            $scope.timeEnd=rowData.clock[0].split('-')[1];
                            $scope.timeRange=$scope.timeData.weekdays;
                            $scope.selectTable($scope.timeData);
                        })
                    },10);
                    $('#timeEdit_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    if(rowData.used.length>0){
                        Showbo.Msg.alert('时间对象'+rowData.name+'已被'+rowData.used[0]+'使用无法进行删除！');
                        return false;
                    }
                    Showbo.Msg.confirm('确定要删除时间对象'+rowData.name+'吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            setTimeout(function() {
                                $scope.$apply(function (e) {
                                    $scope.timeData=rowData;
                                    for(var i=0;i<$scope.time_classData.length;i++){
                                        if($scope.timeData.id==$scope.time_classData[i].id){
                                            $scope.time_classData.splice(i,1);
                                        }
                                    }
                                    $scope.setTimeConf();
                                })
                            });
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.getTimeConf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'time_class'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $scope.time_classData=data.data.time;
                        $scope.timeListTab.update($scope.time_classData);
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.setTimeConf = function () {
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data: JSON.stringify({time_class: {time: $scope.time_classData}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if (data.result == 'ok') {
                rcms.message('设置成功');
                $('#timeEdit_dialog').modal('hide');
                $scope.getTimeConf();
                $scope.get_conf();
            } else {
                $scope.getTimeConf();
                Showbo.Msg.alert(data.msg);
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.timeDel=function(){
        if ($scope.timeListTab.getSelectedRows().length <= 0) {
            Showbo.Msg.alert("请选择要删除的项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                var static_id = $scope.timeListTab.getSelectedRows();
                for(var d = 0; d < static_id.length; d++){
                    if(static_id[d].used.length>0){
                        Showbo.Msg.alert('时间对象'+static_id[d].name+'已被'+static_id[d].used[0]+'使用无法进行删除！');
                        return false;
                    }
                }
                for (var d = 0; d < static_id.length; d++) {
                    for(var i=0;i<$scope.time_classData.length;i++){
                        if($scope.time_classData[i].id==static_id[d].id){
                            $scope.time_classData.splice(i,1);
                        }
                    }
                }
                $scope.setTimeConf();
            }
        })
    };
    $scope.timeAdd=function(){
        setTimeout(function() {
            $scope.$apply(function (e) {
                $scope.nameChange=false;
                $scope.timeData = {};
                $scope.timeStart='00:00';
                $scope.timeEnd='23:59';
                $scope.selectTable(true);
            })
        },10);
        $('#timeEdit_dialog').modal('show');
    };
    $scope.timeControl=function(){
        $("#timeControl_dialog").modal("show");
    };
    $scope.setTimeEdit=function(){
        var weekdayArr=$('#timeSel .select_rel').val().split(';');
        for(var i=0;i<weekdayArr.length;i++){
            if(weekdayArr[i]=='星期一'){
                weekdayArr[i]='1';
            }else if(weekdayArr[i]=='星期二'){
                weekdayArr[i]='2';
            }else if(weekdayArr[i]=='星期三'){
                weekdayArr[i]='3';
            }else if(weekdayArr[i]=='星期四'){
                weekdayArr[i]='4';
            }else if(weekdayArr[i]=='星期五'){
                weekdayArr[i]='5';
            }else if(weekdayArr[i]=='星期六'){
                weekdayArr[i]='6';
            }else if(weekdayArr[i]=='星期日'){
                weekdayArr[i]='7';
            }
        }
        var option=weekdayArr.join(',');
        $scope.timeData.weekdays=option;
        $scope.timeData.clock=[$scope.timeStart+'-'+$scope.timeEnd];
        if($scope.timeData.id){
            for(var j=0;j<$scope.time_classData.length;j++){
                if($scope.time_classData[j].id==$scope.timeData.id){
                    $scope.time_classData[j]=$scope.timeData;
                }
            }
        }else{
            for(var k=0;k<$scope.time_classData.length;k++){
                if($scope.time_classData[k].name==$scope.timeData.name){
                    Showbo.Msg.alert('时间对象'+$scope.timeData.name+'已存在,请重新输入');
                    return false
                }
            }
            $scope.time_classData.push($scope.timeData)
        }
        $scope.setTimeConf();
    };
    $scope.selectTable=function (data,change){
        $('#timeSel').html('');
        $('#timeSel').MSDL({
            'width': '185',
            'data': ['星期日','星期六','星期五','星期四','星期三','星期二','星期一']
        });
        var weekdayArr=[];
        if(data&&!change){
            if(data.weekdays){
                if(data.weekdays=='EveryDay'){
                    weekdayArr=['星期一','星期二','星期三','星期四','星期五','星期六','星期日']
                }else{
                    weekdayArr=data.weekdays.split(',');
                }
                for(var i=0;i<weekdayArr.length;i++){
                    if(weekdayArr[i]=='1'){
                        weekdayArr[i]='星期一';
                    }else if(weekdayArr[i]=='2'){
                        weekdayArr[i]='星期二';
                    }else if(weekdayArr[i]=='3'){
                        weekdayArr[i]='星期三';
                    }else if(weekdayArr[i]=='4'){
                        weekdayArr[i]='星期四';
                    }else if(weekdayArr[i]=='5'){
                        weekdayArr[i]='星期五';
                    }else if(weekdayArr[i]=='6'){
                        weekdayArr[i]='星期六';
                    }else if(weekdayArr[i]=='7'){
                        weekdayArr[i]='星期日';
                    }
                    $("input[value="+weekdayArr[i]+"]")[0].checked=true
                }
                var option=weekdayArr.join(';');
                $('#timeSel .select_rel').val(option);
            }
        }else{
            $('#objectSel .select_rel').val('');
        }
    };
    $scope.getTimeConf();
    $scope.customTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "customTab",
        isAutoResized: false,
        columns: [{
            caption: "自定义应用名称",
            name: "name",
            width:'20%'
        },{
            caption: "协议类型",
            name: "protocol"
        },{
            caption: "所属分类",
            name: "father_class",
            formater:function(rowIndex, value, rowData){
                var option='';
                for(var i=0;i<$scope.selectApp.length;i++){
                    if(rowData.father_class==$scope.selectApp[i].value){
                        option=$scope.selectApp[i].name;
                    }
                }
                return option;
            }
        },{
            caption: "源端口",
            name: "srcport"
        },{
            caption: "目的端口",
            name: "dstport"
        },{
            caption: "源IP",
            name: "srcip"
        },{
            caption: "目的IP",
            name: "dstip"
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.customData=rowData;
                            if($scope.customData.srcip=='any'){
                                $scope.ipStartType='2'
                            }else{
                                $scope.ipStartType='1'
                            }
                            if($scope.customData.srcport=='any'){
                                $scope.portStartType='2'
                            }else{
                                $scope.portStartType='1'
                            }
                            if($scope.customData.dstip=='any'){
                                $scope.ipEndType='2'
                            }else{
                                $scope.ipEndType='1'
                            }
                            if($scope.customData.dstport=='any'){
                                $scope.portEndType='2'
                            }else{
                                $scope.portEndType='1'
                            }
                        })
                    },10);
                    $('#custom_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    if(rowData.used.length>0){
                        Showbo.Msg.alert('应用'+rowData.name+'已被'+rowData.used[0]+'使用无法进行删除！');
                        return false;
                    }
                    Showbo.Msg.confirm('确定要删除应用'+rowData.name+'吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.app_classData.length;i++){
                                if($scope.app_classData[i].id==rowData.id){
                                    $scope.app_classData.splice(i,1);
                                }
                            }
                            var dataArr={app_class:{app:$scope.app_classData}};
                            $scope.set_confOk(dataArr);
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.packetCustom=function(){
        setTimeout(function(){
            $scope.$apply(function (e) {
                $scope.ipStartType='1';
                $scope.portStartType='1';
                $scope.ipEndType='1';
                $scope.portEndType='1';
                $scope.customData={protocol:'tcp',father_class:$scope.selectApp[0].value,srcport:'',dstport:'',srcip:'',dstip:'',rule_type:'srcip_dstip'};
            })
        },10);
        $('#custom_dialog').modal('show');
    };
    $scope.setCustom=function(){
        if($scope.ipStartType=='2'){
            $scope.customData.srcip='any';
        }
        if($scope.ipEndType=='2'){
            $scope.customData.dstip='any';
        }
        if($scope.portEndType=='2'){
            $scope.customData.dstport='any';
        }
        if($scope.portStartType=='2'){
            $scope.customData.srcport='any';
        }
        if($scope.customData.id){
            for(var i=0;i<$scope.app_classData.length;i++){
                if($scope.app_classData[i].id==$scope.customData.id){
                    $scope.app_classData[i]=$scope.customData;
                }
            }
        }else{
            $scope.app_classData.push($scope.customData);
        }
        var dataArr={app_class:{app:$scope.app_classData}};
        $scope.set_confOk(dataArr);
    };
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:['app_class','mac_class','ip_class','domain_class']})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                setTimeout(function(){
                    $scope.$apply(function(e){
                        $scope.app_classData=data.data.app_class.app;
                        $scope.selectApp=data.data.app_class.class;
                        $scope.customTab.update($scope.app_classData);
                        $scope.ip_classData=data.data.ip_class.ip;
                        $scope.ipTab.update($scope.ip_classData);
                        $scope.mac_classData=data.data.mac_class.mac;
                        $scope.macTab.update($scope.mac_classData);
                        $scope.domain_classData=data.data.domain_class.domain;
                        $scope.networkDomainTab.update($scope.domain_classData);
                    })
                },10);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.get_conf();
    $scope.networkDomainTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "networkDomainTab",
        isAutoResized: false,
        columns: [{
            caption: "域名对象",
            name: "name",
            width:'15%'
        },{
            caption: "域名地址",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option=rowData.value.join(',');
                return option;
            }
        },{
            caption:"操作",
            name:'',
            width:'15%',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.domain_classListData=rowData;
                        })
                    },10);
                    $('#domainEdit_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    if(rowData.used.length>0){
                        Showbo.Msg.alert('域名对象'+rowData.name+'已被'+rowData.used[0]+'使用无法进行删除！');
                        return false;
                    }
                    Showbo.Msg.confirm('确定要删除域名对象'+rowData.name+'吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            setTimeout(function() {
                                $scope.$apply(function (e) {
                                    for(var i=0;i<$scope.domain_classData.length;i++){
                                        if(rowData.id==$scope.domain_classData[i].id){
                                            $scope.domain_classData.splice(i,1);
                                        }
                                    }
                                    var dataArr={domain_class:{domain:$scope.domain_classData}};
                                    $scope.set_confOk(dataArr);
                                })
                            });
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.ipTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "ipTab",
        isAutoResized: false,
        columns: [{
            caption: "IP对象",
            name: "name",
            width:'15%'
        },{
            caption: "IP地址",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option=rowData.ip_sigle.join(',');
                return option;
            }
        },{
            caption: "IP范围",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option=rowData.ip_range.join(',');
                return option;
            }
        },{
            caption: "IP网段",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option=rowData.ip_net.join(',');
                return option;
            }
        },{
            caption:"操作",
            name:'',
            width:'15%',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.ip_classListData=rowData;
                            for(var i=0;i<$scope.ip_classListData.ip_net.length;i++){
                                $scope.ip_classListData.ip_net[i]=$scope.ip_classListData.ip_net[i].split(' ');
                            }
                            for(var i=0;i<$scope.ip_classListData.ip_range.length;i++){
                                $scope.ip_classListData.ip_range[i]=$scope.ip_classListData.ip_range[i].split(' ');
                            }
                            console.log($scope.ip_classListData.ip_net);
                            console.log($scope.ip_classListData.ip_range);
                        })
                    },10);
                    $('#ipEdit_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    if(rowData.used.length>0){
                        Showbo.Msg.alert('IP对象'+rowData.name+'已被'+rowData.used[0]+'使用无法进行删除！');
                        return false;
                    }
                    Showbo.Msg.confirm('确定要删除IP对象'+rowData.name+'吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            setTimeout(function() {
                                $scope.$apply(function (e) {
                                    for(var i=0;i<$scope.ip_classData.length;i++){
                                        if(rowData.id==$scope.ip_classData[i].id){
                                            $scope.ip_classData.splice(i,1);
                                        }
                                    }
                                    var dataArr={ip_class:{ip:$scope.ip_classData}};
                                    $scope.set_confOk(dataArr);
                                })
                            });
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.macTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "macTab",
        isAutoResized: false,
        columns: [{
            caption: "MAC对象",
            name: "name",
            width:'15%'
        },{
            caption: "MAC地址",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option=rowData.value.join(',');
                return option;
            }
        },{
            caption:"操作",
            name:'',
            width:'15%',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.mac_classListData=rowData;
                        })
                    },10);
                    $('#macEdit_dialog').modal('show');
                };
                opration[1].onclick = function(){
                    if(rowData.used.length>0){
                        Showbo.Msg.alert('MAC对象'+rowData.name+'已被'+rowData.used[0]+'使用无法进行删除！');
                        return false;
                    }
                    Showbo.Msg.confirm('确定要删除MAC对象'+rowData.name+'吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            setTimeout(function() {
                                $scope.$apply(function (e) {
                                    for(var i=0;i<$scope.mac_classData.length;i++){
                                        if(rowData.id==$scope.mac_classData[i].id){
                                            $scope.mac_classData.splice(i,1);
                                        }
                                    }
                                    var dataArr={mac_class:{mac:$scope.mac_classData}};
                                    $scope.set_confOk(dataArr);
                                })
                            });
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: true,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.deleteMac=function(mac){
        setTimeout(function(){
            $scope.$apply(function (e) {
                for(var i=0;i<$scope.mac_classListData.value.length;i++){
                    if($scope.mac_classListData.value[i]==mac){
                        $scope.mac_classListData.value.splice(i,1);
                    }
                }
            })
        },10);
    };
    $scope.addMac=function(){
        setTimeout(function(){
            $scope.$apply(function (e) {
                $scope.mac_classListData.value.push("");
            })
        },10);
    };
    $scope.deleteDomain=function(domain){
        setTimeout(function(){
            $scope.$apply(function (e) {
                for(var i=0;i<$scope.domain_classListData.value.length;i++){
                    if($scope.domain_classListData.value[i]==domain){
                        $scope.domain_classListData.value.splice(i,1);
                    }
                }
            })
        },10);
    };
    $scope.addDomain=function(){
        setTimeout(function(){
            $scope.$apply(function (e) {
                $scope.domain_classListData.value.push("");
            })
        },10);
    };
    $scope.deleteIp=function(ip,type){
        setTimeout(function(){
            $scope.$apply(function (e) {
                if(type=='ip_sigle'){
                    for(var i=0;i<$scope.ip_classListData.ip_sigle.length;i++){
                        if($scope.ip_classListData.ip_sigle[i]==ip){
                            $scope.ip_classListData.ip_sigle.splice(i,1);
                        }
                    }
                }else if(type=='ip_net'){
                    for(var i=0;i<$scope.ip_classListData.ip_net.length;i++){
                        if($scope.ip_classListData.ip_net[i]==ip){
                            $scope.ip_classListData.ip_net.splice(i,1);
                        }
                    }
                }else if(type=='ip_range'){
                    for(var i=0;i<$scope.ip_classListData.ip_range.length;i++){
                        if($scope.ip_classListData.ip_range[i]==ip){
                            $scope.ip_classListData.ip_range.splice(i,1);
                        }
                    }
                }
            })
        },10);
    };
    $scope.addIp=function(type){
        setTimeout(function(){
            $scope.$apply(function (e) {
                if(type=='ip_net'){
                    $scope.ip_classListData.ip_net.push(["",""]);
                }else if(type=='ip_range'){
                    $scope.ip_classListData.ip_range.push(["",""]);
                }else{
                    $scope.ip_classListData.ip_sigle.push("");
                }
            })
        },10);
    };
    $scope.addDomainPlay=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $scope.domain_classListData={name:'',used:[],value:[]};
            })
        },10);
        $('#domainEdit_dialog').modal('show');
    };
    $scope.addIpPlay=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $scope.ip_classListData={name:'',used:[],ip_net:[],ip_range:[],ip_sigle:[]};
            })
        },10);
        $('#ipEdit_dialog').modal('show');
    };
    $scope.addMacPlay=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $scope.mac_classListData={name:'',used:[],value:[]};
            })
        },10);
        $('#macEdit_dialog').modal('show');
    };
    $scope.set_conf=function(type){
        var dataArr={};
        $('#domainEdit_dialog').modal('hide');
        $('#macEdit_dialog').modal('hide');
        $('#ipEdit_dialog').modal('hide');
        if(type=='ip'){
            for(var j=0;j<$scope.ip_classListData.ip_range.length;j++){
                $scope.ip_classListData.ip_range[j]=$scope.ip_classListData.ip_range[j].join(' ');
            }
            for(var j=0;j<$scope.ip_classListData.ip_net.length;j++){
                $scope.ip_classListData.ip_net[j]=$scope.ip_classListData.ip_net[j].join(' ');
            }
            if($scope.ip_classListData.id){
                for(var i=0;i<$scope.ip_classData.length;i++){
                    if($scope.ip_classListData.id==$scope.ip_classData[i].id){
                        $scope.ip_classData[i]=$scope.ip_classListData;
                    }
                }
            }else{
                $scope.ip_classData.push($scope.ip_classListData);
            }
            dataArr={ip_class:{ip:$scope.ip_classData}};
        }else if(type=='mac'){
            if($scope.mac_classListData.id){
                for(var i=0;i<$scope.mac_classData.length;i++){
                    if($scope.mac_classListData.id==$scope.mac_classData[i].id){
                        $scope.mac_classData[i]=$scope.mac_classListData;
                    }
                }
            }else{
                $scope.mac_classData.push($scope.mac_classListData);
            }
            dataArr={mac_class:{mac:$scope.mac_classData}};
        }else if(type=='domain'){
            if($scope.domain_classListData.id){
                for(var i=0;i<$scope.domain_classData.length;i++){
                    if($scope.domain_classListData.id==$scope.domain_classData[i].id){
                        $scope.domain_classData[i]=$scope.domain_classListData;
                    }
                }
            }else{
                $scope.domain_classData.push($scope.domain_classListData);
            }
            dataArr={domain_class:{domain:$scope.domain_classData}};
        }
        $scope.set_confOk(dataArr)
    };
    $scope.delSelect=function(type){
        var static_id=0;
        var dataArr={};
        if(type=='domain'){
            static_id = $scope.networkDomainTab.getSelectedRows();
        }else if(type=='mac'){
            static_id = $scope.macTab.getSelectedRows();
        }else if(type=='ip'){
            static_id = $scope.ipTab.getSelectedRows();
        }else if(type=='app'){
            static_id = $scope.customTab.getSelectedRows();
        }
        if (static_id.length <= 0) {
            Showbo.Msg.alert("请选择要删除的项");
            return false;
        }
        Showbo.Msg.confirm('确定要删除选中项？', function(btn) {
            if(btn=='no'){
                return false;
            }else{
                for(var d = 0; d < static_id.length; d++){
                    if(static_id[d].used.length>0){
                        Showbo.Msg.alert('对象'+static_id[d].name+'已被'+static_id[d].used[0]+'使用无法进行删除！');
                        return false;
                    }
                }
                if(type=='domain'){
                    for (var d = 0; d < static_id.length; d++) {
                        for (var i = 0; i < $scope.domain_classData.length; i++) {
                            if ($scope.domain_classData[i].id == static_id[d].id) {
                                $scope.domain_classData.splice(i, 1);
                            }
                        }
                    }
                    dataArr={domain_class:{domain:$scope.domain_classData}};
                }else if(type=='mac'){
                    for (var d = 0; d < static_id.length; d++) {
                        for (var i = 0; i < $scope.mac_classData.length; i++) {
                            if ($scope.mac_classData[i].id == static_id[d].id) {
                                $scope.mac_classData.splice(i, 1);
                            }
                        }
                    }
                    dataArr={mac_class:{mac:$scope.mac_classData}};
                }else if(type=='ip'){
                    for (var d = 0; d < static_id.length; d++) {
                        for(var i=0;i<$scope.ip_classData.length;i++){
                            if($scope.ip_classData[i].id==static_id[d].id){
                                $scope.ip_classData.splice(i,1);
                            }
                        }
                    }
                    dataArr={ip_class:{ip:$scope.ip_classData}};
                }else if(type=='app'){
                    for (var d = 0; d < static_id.length; d++) {
                        for(var i=0;i<$scope.app_classData.length;i++){
                            if($scope.app_classData[i].id==static_id[d].id){
                                $scope.app_classData.splice(i,1);
                            }
                        }
                    }
                    dataArr={app_class:{app:$scope.app_classData}};
                }
                $scope.set_confOk(dataArr);
            }
        })
    };
    $scope.set_confOk=function(dataArr){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify(dataArr)
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('设置成功');
                $scope.get_conf();
            }else{
                Showbo.Msg.alert(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    }
});
myApp.controller('vpn', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/vpn';
    $scope.vpnListTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "vpnListTab",
        isAutoResized: false,
        columns: [{
            caption: "设备名称",
            name: "name"
        },{
            caption: "连接状态",
            name: "status"
        },{
            caption: "总部服务器地址",
            name: "right"
        },{
            caption: "总部网段",
            name: "",
            formater:function(rowIndex, value, rowData){
                var option='';
                for(var i=0;i<rowData.subnet.length;i++){
                    option=option+' '+rowData.subnet[i].rightsubnet+'/'+rowData.subnet[i].rightmask;
                }
                return option;
            }
        },{
            caption:"操作",
            name:'',
            formater:function(rowIndex, value, rowData){
                var opration='';
                opration = $('<span class="btn btn-primary">编辑</span><span class="btn btn-danger marginLeft10">删除</span>').data(rowData);
                opration[0].onclick = function(){
                    setTimeout(function(){
                        $scope.$apply(function (e) {
                            $scope.clickNextStep=false;
                            $scope.vpn=rowData;
                        })
                    },10);
                    $('#vpn_dialog2').modal('show');
                };
                opration[1].onclick = function(){
                    Showbo.Msg.confirm('确定要删除该VPN服务吗？', function(btn) {
                        if (btn == "no") {
                            return false;
                        } else {
                            for(var i=0;i<$scope.ipsec.server.length;i++){
                                if($scope.ipsec.server[i].id==rowData.id){
                                    $scope.ipsec.server.splice(i,1);
                                }
                            }
                            $scope.conf_set();
                        }
                    });
                };
                return opration;
            }
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.get_conf=function(){
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/get_conf/',
            data:JSON.stringify({conf_name:'ipsec'})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                $scope.ipsec=data.data;
                if($scope.ipsec.enable==1){
                    $('#div2')[0].className="open2";
                    $('#div1')[0].className="open1";
                }else{
                    $('#div2')[0].className="close2";
                    $('#div1')[0].className="close1";
                }
                $scope.vpnListTab.update($scope.ipsec.server);
            }else{
                rcms.message(data.msg);
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        })
    };
    $scope.setSubnet=function(){
        if($scope.vpn.id){
            for(var i=0;i<$scope.ipsec.server.length;i++){
                if($scope.vpn.id==$scope.ipsec.server[i].id){
                    $scope.ipsec.server[i]=$scope.vpn;
                }
            }
        }else{
            $scope.ipsec.server.push($scope.vpn);
        }
        $scope.conf_set()
    };
    $scope.conf_set=function(){
        $("#wait_dialog").modal("show");
        rcms.ajax({
            type: 'post',
            url: '/apis/conf/set_conf/',
            data:JSON.stringify({ipsec:{enable:$scope.ipsec.enable,server:$scope.ipsec.server}})
        }).success(function (data) {
            $("#wait_dialog").modal("hide");
            if(data.result=='ok'){
                rcms.message('设置成功');
                $('#vpn_dialog').modal('hide');
                $('#vpn_dialog2').modal('hide');
                $scope.get_conf();
            }else{
                Showbo.Msg.alert(data.msg);
                $scope.get_conf();
            }
        }).error(function(data){
            $("#wait_dialog").modal("hide");
            //rcms.message(data.msg);
        });
    };
    $scope.addSubnet=function(){
        setTimeout(function() {
            $scope.$apply(function (e) {
                $scope.vpn.subnet.push({leftsubnet: '', leftmask: '', rightsubnet: '', rightmask: ''});
            })
        })
    };
    $scope.delSubnet=function(id){
        setTimeout(function(){
            $scope.$apply(function (e) {
                for(var i=0;i<$scope.vpn.subnet.length;i++){
                    if($scope.vpn.subnet[i].id==id){
                        $scope.vpn.subnet.splice(i,1);
                    }
                }
            })
        },10);
    };
    $scope.addConf=function(){
        setTimeout(function(){
            $scope.$apply(function(e){
                $scope.clickNextStep=false;
                $scope.vpn = {
                    name:"",
                    right:"",
                    key:"",
                    auth_enable:0,
                    left_authmode:"FQDN",
                    right_authmode:"FQDN",
                    leftid:"",
                    rightid:"",
                    model:"master",
                    DH:"MODP1024",
                    ISAKMP_encryption:"3DES",
                    ISAKMP_auth:"MD5",
                    ISAKMP_lifetime:86400,
                    subnet:[
                        {
                            leftsubnet:"",
                            leftmask:"",
                            rightsubnet:"",
                            rightmask:""
                        }
                    ],
                    ESP_encryption:"3DES",
                    ESP_auth:"MD5",
                    SA_keylife:3600,
                    pfs:""
                };            })
        },10);
        $('#vpn_dialog').modal('show');
    };
    $('#div1').on('click',function() {
        var divNum = this.id.split('div')[1];
        Showbo.Msg.confirm('确定要'+($('#div2')[0].className == "open2"?'关闭':'开启')+'VPN服务吗？', function(btn) {
            if (btn == "no") {
                return false;
            } else {
                setTimeout(function(){
                    $scope.$apply(function(e){
                        if (divNum == '1') {
                            if ($('#div2')[0].className == "open2") {
                                $scope.ipsec.enable=0;
                            } else {
                                $scope.ipsec.enable=1;
                            }
                        }
                        $('#div' + (parseInt(divNum) + 1).toString())[0].className = ($('#div' + (parseInt(divNum) + 1).toString())[0].className == "close2") ? "open2" : "close2";
                        $('#div' + divNum)[0].className = ($('#div' + divNum)[0].className == "close1") ? "open1" : "close1";
                        $scope.conf_set();
                    })
                },10)
            }
        });
    });
    $scope.get_conf();
});
myApp.controller('dialog', function ($scope, Data,$timeout) {
    $("#wait_dialog").modal("show");
    window.sessionStorage.pageUrl='#/dialog';
    $scope.userTab=new rui.Grid({
        mergeRowIndexs:[1],
        gridData: [],
        gridId: "userTab",
        isAutoResized: false,
        columns: [{
            caption: "操作用户",
            name: "user"
        },{
            caption: "IP地址",
            name: "ip"
        },{
            caption: "时间",
            name: "time"
        },{
            caption: "操作",
            name: "opera"
        }],
        isPage: true,
        isScroll: false,
        isMulti: false,
        isIntervalColor: true,
        stopTrPropagation: false
    });
    $scope.getInitMsg=function(userData){
        rcms.ajax({
            type: 'post',
            url: '/apis/log/user_log/',
            data:JSON.stringify(userData)
        }).success(function (data) {
            if(data.result=='ok'){
                $scope.userLogs=data.logs;
                $scope.userTab.update(data.logs);
                $("#wait_dialog").modal("hide");
            }else{
                rcms.message(data.msg);
                $("#wait_dialog").modal("hide");
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
        })
    };
    $scope.sys={begin_date:'',end_date:'',num:20,type:'sys'};
    $scope.sysSurf=function(){
        if($scope.sys.end_date<$scope.sys.begin_date){
            Showbo.Msg.alert('请输入结束时间不小于开始时间');
            return false;
        }
        rcms.ajax({
            type: 'post',
            url: '/apis/log/sys_log/',
            data:JSON.stringify($scope.sys)
        }).success(function (data) {
            if(data.result=='ok'){
                $('#sysZone').html('');
                $('<span>'+data.logs+'</span>').appendTo($('#sysZone'));
                $("#wait_dialog").modal("hide");
            }else{
                rcms.message(data.msg);
                $("#wait_dialog").modal("hide");
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
        })
    };
    $scope.pppd={begin_date:'',end_date:'',num:20,type:'pppd'};
    $scope.pppdSurf=function(){
        if($scope.pppd.end_date<$scope.pppd.begin_date){
            Showbo.Msg.alert('请输入结束时间不小于开始时间');
            return false;
        }
        rcms.ajax({
            type: 'post',
            url: '/apis/log/sys_log/',
            data:JSON.stringify($scope.pppd)
        }).success(function (data) {
            if(data.result=='ok'){
                $('#pppdZone').html('');
                $('<span>'+data.logs+'</span>').appendTo($('#pppdZone'));
                $("#wait_dialog").modal("hide");
            }else{
                rcms.message(data.msg);
                $("#wait_dialog").modal("hide");
            }
        }).error(function (data) {
            $("#wait_dialog").modal("hide");
        })
    };
    $scope.user={begin_date:'',end_date:'',num:20};
    $scope.userSurf=function(){
        if($scope.user.end_date<$scope.user.begin_date){
            Showbo.Msg.alert('请输入结束时间不小于开始时间');
            return false;
        }
        $scope.getInitMsg($scope.user);
    };
    $scope.getInitMsg($scope.user);
    $scope.selectIp=function(){
        var leasesData=[];
        for(var i=0;i<$scope.userLogs.length;i++){
            if($scope.userLogs[i].user.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.userLogs[i]);
            }else if($scope.userLogs[i].ip.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.userLogs[i]);
            }else if($scope.userLogs[i].time.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.userLogs[i]);
            }else if($scope.userLogs[i].opera.indexOf($scope.selectValue)!=-1){
                leasesData.push($scope.userLogs[i]);
            }
        }

        $scope.userTab.update(leasesData);
    };
});