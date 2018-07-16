'use strict';

angular.module('grcmsApp')
  .service('filterServ', ['$rootScope', function($rootScope) {
    return {
      getModels: function() {
        var vm = $rootScope;
        // if (vm.fb_models) {
        //   return vm.fb_models;
        // }
        var fb_m = sessionStorage.getItem('fb_models');
        console.log(fb_m);
        if (fb_m) {
          console.log("get models from sessionStorage.");
          vm.fb_models = JSON.parse(fb_m);
        }

        var models = sessionStorage.getItem('all_models');
        var prefer = sessionStorage.getItem('user_prefer');
        if (!models) {
          $.ajax({
              type: "POST",
              url: "/apis/getmodels/",
              dataType: "json",
              success: function(data) {
                if (data) {
                  models = JSON.stringify(data);
                  sessionStorage.setItem("all_models", JSON.stringify(data));
                } else {
                  console.error("get models failed");
                  models = [];
                }
              }
            });
        }
        if (!models) {
          return
        }
        if (!prefer) {
          prefer = '{}';
          console.error("get prefer failed");
        }
          console.log(prefer);
        var fb_models = JSON.parse(models);
        var fb_prefer = JSON.parse(prefer);
        fb_models = fb_models.data;
        if (fb_prefer.model) {
            fb_prefer = fb_prefer.model;
        } else {
            fb_prefer = fb_models;
        }

        fb_m = {};
        for (var key in fb_models) {
          var m_t = fb_models[key];
          var p_t = fb_prefer[key];
          var ms = new Array();
          for (var i in m_t) {
            var m = m_t[i];
            var checked = false;
            for (var j in p_t) {
              if (p_t[j] == m) {
                checked = true;
                break;
              }
            }

            ms.push({model:m, checked:checked});
          }
          fb_m[key] = ms;
        }
        vm.fb_models = fb_m;
        sessionStorage.setItem('fb_models', JSON.stringify(fb_m));
      },
      set_fb: function(dev_type) {
        var vm = $rootScope;
        vm.fb_models[dev_type] = vm.dev_models;
        sessionStorage.setItem('fb_models', JSON.stringify(vm.fb_models));
        // console.log(sessionStorage.getItem('fb_models'));
        var p = {model:{}};
        for (var key in vm.fb_models) {
          var m_t = vm.fb_models[key];
          var tmp = new Array();
          for (var i in m_t) {
            if (m_t[i].checked) {
              tmp.push(m_t[i].model);
            }
          }
          p.model[key] = tmp;
        }
        sessionStorage.setItem('user_prefer', JSON.stringify(p));
        $.ajax({
          type: "POST",
          url: "/apis/preference/set_pref/",
          data: JSON.stringify(p),
          dataType: "json",
          success: function(data) {

          },
          // failed: {
          //   alert("设置失败，请重试");
          // }
        });
      },
      addBook: function ( book ) {
        service.books.push( book );
        $rootScope.$broadcast( 'books.update' );
      }
    };
  }]);
  angular.module('grcmsApp').directive('filterDialog', ['filterServ', function (filterServ) {
    return {
      restrict: 'AE',
      template: '<div id="fb_dialog" title="" style="display:none">'
              + '  <label for="chkAll">全选:</label>'
              + '  <input type="checkbox" ng-model="fb_chkall" ng-click="chkAll(fb_chkall)"/>'
              + '  <div class="row">'
              + '    <ul ng-repeat="dev in dev_models">'
              + '      <div class="col-md-6">'
              + '        <input type="checkbox" ng-model="dev.checked"/>{{dev.model}}'
              + '      </div>'
              + '    </ul>'
              + '  </div>'
              + '</div>',
      controller: function ($scope) {
        var vm = $scope;
        vm.fb_models = filterServ.getModels();
         vm.chkAll = function(checked){
            angular.forEach(vm.dev_models, function(value, key){
              value.checked = !checked;
            });
        };
      },
    };
  }]);

angular.module('grcmsApp')
  .directive('filterBar', ['$rootScope', 'filterServ', function ($rootScope, filterServ) {
    return {
      restrict: 'AE',
      // require: '^ngModel',
/*/
      template: '' //<div id="test_fb" class="m-b-sm">
                  +'<div class="btn-group">'
                  +  '<button type="button" class="btn-router" ng-click="showDevs($event, ' + "'ROUTER'" + ')"></button>'
                  +  '<button type="button" class="btn-wireless" ng-click="showDevs($event, ' + "'WIRELESS'" + ')"></button>'
                  +  '<button type="button" class="btn-switch" ng-click="showDevs($event, ' + "'SWITCH'" + ')"></button>'
                  + '</div>', //</div>
//*/
      link:function(scope,element,attrs,diagCtrl) {
        scope.showDevs = function($event, dev_type) {
            filterServ.getModels();
            $rootScope.dev_models = $rootScope.fb_models[dev_type];
            var models = $rootScope.dev_models;
            var cnt = 0;
            for (var i in models) {
              if (models[i].checked) {
                  cnt ++;
              }
            }
            if (cnt == models.length) {
              $rootScope.fb_chkall = true;
            } else {
              $rootScope.fb_chkall = false;
            }
            try {
              $( "#fb_dialog" ).dialog( "close" );
            } catch(e) {
              console.log("xxx");
            }
          var product;
          if (dev_type == "WIRELESS") {
              product = "无线";
          } else if (dev_type == "SWITCH") {
              product = "交换机";
          } else {
              product = "路由";
          }
          $( "#fb_dialog" ).dialog(
            {
              title: product + "设备型号选择",
              width: 360,
              modal: true,
              buttons: [
                        {
                          text: "确定",
                          click: function() {
                            filterServ.set_fb(dev_type);
                            $(this).dialog("close");
                          }
                        },
                        { text: "取消", click: function() { $(this).dialog( "close" ); } } ],
            });
            var offset = $(event.target).offset();
            var to = offset.top + $(event.target).outerHeight();

             $( "#fb_dialog" ).dialog("option", "position", { my: "left top+" + to, at: "left+" + offset.left + " top", });
             $( "#fb_dialog" ).dialog( "open" );
        }
      },
    };
  }]);

