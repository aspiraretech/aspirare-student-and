'use strict';

angular.module('smartStudentApp').factory('NotificationsFactory', function ($q, $http, LoginFactory) {
    var factory = {
        selectedNotification: null,
        articleId: null
    };

    var URL = LoginFactory.getBaseUrl() + '/secure';

    factory.getAllNotifications = function (studentId) {
        var d = $q.defer();
        $http({
            method: 'GET',
            url: URL + '/getAllStudentNotifications/' + studentId
        }).then(function (success) {
            d.resolve(success);
        }, function (error) {
            d.reject(error);
        });
        return d.promise;
    };

    return factory;
});