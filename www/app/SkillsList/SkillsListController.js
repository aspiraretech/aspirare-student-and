'use strict';
angular.module('smartStudentApp')
    .controller('SkillsListController', function($scope, $state, ionicToast, DashboardFactory) {

        $scope.skills = DashboardFactory.tags;

        $scope.skillSelected = function(skill) {
            DashboardFactory.selectedSkill = skill;
            $state.go('menu.upgradeSkills');
        };

    });