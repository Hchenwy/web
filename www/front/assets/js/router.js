/**
 * Created by chenhuaqu on 2016/4/30.
 */
var myApp = angular.module('grcmsApp', ['ui.router', 'ngGrid', 'ui.sortable', 'grcmsApp.myApp','oc.lazyLoad'])
myApp .config(
    ['$controllerProvider', '$compileProvider', '$filterProvider', '$provide', function ($controllerProvider, $compileProvider, $filterProvider, $provide,$HttpProvider) {
        myApp.controller = $controllerProvider.register;
        myApp.directive = $compileProvider.directive;
        myApp.filter = $filterProvider.register;
        myApp.decorator = $provide.decorator;
        myApp.factory = $provide.factory;
        myApp.service = $provide.service;
        myApp.constant = $provide.constant;
        myApp.value = $provide.value;
    }]
)
    .config(function($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.when('', '/mainCtrl');
        $stateProvider
            //初始页面
            .state('mainCtrl', {
                url: '/mainCtrl',
                controller: 'mainCtrl'
            })
            // 运营中心-集中管理
            .state('CentralizedManagement', {
                url: '/CentralizedManagement',
                views: {
                    "@CentralizedManagement": {
                        templateUrl: 'views/DeviceOverview.html',
                        controller: 'deviceOverviewCtrl',
                        resolve: {
                            deps: [ '$ocLazyLoad',
                                function ($ocLazyLoad) {
                                    return $ocLazyLoad.load(['assets/plugins/highcharts.js','assets/plugins/exporting.js']);
                                }
                            ]
                        }
                    }
                }
            })
            // 运营中心-集中管理-设备概览
            .state('DeviceOverview', {
                url: '/DeviceOverview',
                templateUrl: 'views/DeviceOverview.html',
                controller: 'deviceOverviewCtrl',
                resolve: {
                    deps: [ '$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load(['assets/plugins/highcharts.js','assets/plugins/exporting.js']);
                        }
                    ]
                }
            })
            // 运营中心-集中管理-设备列表
            .state('equipmentList', {
                url: '/equipmentList',
                templateUrl: 'views/equipmentList.html',
                controller: 'equipmentListCtrl',
                resolve: {
                    deps: [ '$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load(['assets/plugins/highcharts.js','assets/plugins/exporting.js','assets/controller/equipmentListCtrl.js']);
                        }
                    ]
                }
            })
            // 运营中心-集中管理-上网认证
            .state('webAuth', {
                url: '/webAuth',
                templateUrl: 'views/webAuth.html',
                controller: 'webAuth'
            })
            // 运营中心-集中管理-网络监测
            .state('tracertSurf', {
                url: '/tracertSurf',
                templateUrl: 'views/tracertSurf.html',
                controller: 'tracertSurf'
            })
            // 运营中心-集中管理-SNMP扫描
            .state('snmpSurf', {
                url: '/snmpSurf',
                templateUrl: 'views/snmpSurf.html',
                controller: 'snmpSurf'
            })
            // 运营中心-集中管理-SNMP扫描
            .state('interfaceSet', {
                url: '/interfaceSet',
                templateUrl: 'views/interfaceSet.html',
                controller: 'interfaceSet'
            })
            // 运营中心-集中管理-SNMP扫描
            .state('updateDev', {
                url: '/updateDev',
                templateUrl: 'views/updateDev.html',
                controller: 'updateDev'
            })
            // 运营中心-集中管理-网监审计
            .state('netCkeck', {
                url: '/netCkeck',
                templateUrl: 'views/netCkeck.html',
                controller: 'netCkeck'
            })
            .state('routerDev', {
                url: '/routerDev',
                templateUrl: 'views/routerDev.html',
                controller: 'routerDev'
            })
            .state('dnsDev', {
                url: '/dnsDev',
                templateUrl: 'views/dnsDev.html',
                controller: 'dnsDev'
            })
            .state('dhcpDev', {
                url: '/dhcpDev',
                templateUrl: 'views/dhcpDev.html',
                controller: 'dhcpDev'
            })
            .state('networkMode', {
                url: '/networkMode',
                templateUrl: 'views/networkMode.html',
                controller: 'networkMode'
            })
            .state('interfaceMsg', {
                url: '/interfaceMsg',
                templateUrl: 'views/interfaceMsg.html',
                controller: 'interfaceMsg'
            })
            .state('portmap', {
                url: '/portmap',
                templateUrl: 'views/portmap.html',
                controller: 'portmap'
            })
            .state('antiAttack', {
                url: '/antiAttack',
                templateUrl: 'views/antiAttack.html',
                controller: 'antiAttack'
            })
            .state('arp', {
                url: '/arp',
                templateUrl: 'views/arp.html',
                controller: 'arp'
            })
            .state('acl', {
                url: '/acl',
                templateUrl: 'views/acl.html',
                controller: 'acl',
                resolve: {
                    deps: [ '$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load(['assets/js/MultiSelectDropList.js']);
                        }
                    ]
                }
            })
            .state('linkNum', {
                url: '/linkNum',
                templateUrl: 'views/linkNum.html',
                controller: 'linkNum'
            })
            .state('networkAcCtrl', {
                url: '/networkAcCtrl',
                templateUrl: 'views/networkAcCtrl.html',
                controller: 'networkAcCtrl',
                resolve: {
                    deps: [ '$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load(['assets/js/MultiSelectDropList.js']);
                        }
                    ]
                }
            })
            .state('control', {
                url: '/control',
                templateUrl: 'views/control.html',
                controller: 'control'
            })
            .state('packetManagement', {
                url: '/packetManagement',
                templateUrl: 'views/packetManagement.html',
                controller: 'packetManagement',
                resolve: {
                    deps: [ '$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load(['assets/js/MultiSelectDropList.js']);
                        }
                    ]
                }
            })
            .state('vpn', {
                url: '/vpn',
                templateUrl: 'views/vpn.html',
                controller: 'vpn'
            })
            .state('dialog', {
                url: '/dialog',
                templateUrl: 'views/dialog.html',
                controller: 'dialog'
            })
    });
