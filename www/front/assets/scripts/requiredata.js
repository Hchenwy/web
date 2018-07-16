/*jshint unused: vars */

requirejs.config({
    //By default load any module IDs from js/lib

    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        angular: '../assets/scripts/angular',
        ui_router:'../assets/scripts/angular-ui-router.min',
        ng_grid:'../assets/plugins/ng-grid/ng-grid-2.0.11.min',
        animate:'../assets/plugins/angular-animate/angular-animate',
        all_controller:'../assets/controller/allController',
        sortable: '../assets/scripts/sortable',
        comm_controller:'../assets/controller/commonConfigurationCtrl'
    },
    shim:{
        'angular': {'exports': 'angular' },
        "animate":{deps: ['angular']}
    },
    priority:['angular']


});

// Start the main app logic.
require(['angular','approuter','ui_router','ng_grid','animate','sortable','all_controller','comm_controller'],
    function (angular, approuter) {
        'use strict';
        /* jshint ignore:start */
        var $html = angular.element(document.getElementsByTagName('html')[0]);
        /* jshint ignore:end */
        angular.element().ready(function () {
            angular.resumeBootstrap([approuter.name]);
        });

    });
