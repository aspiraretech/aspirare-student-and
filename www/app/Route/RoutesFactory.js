'use strict';

angular.module('smartStudentApp').factory('RoutesFactory', function($q, $http, LoginFactory) {
    var factory = {
        selectedRoute: {}
    };

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getRouteByStudent = function(routeId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getRouteById/' + routeId
        }).then(function(success) {
            d.resolve(success);
        }, function(error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});