// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('smartStudentApp', ['ionic',
    'ionic-datepicker',
    'angular-svg-round-progressbar',
    'ionic-toast',
    'ngCordova',
    'ion-gallery',
    'timer',
    'ion-floating-menu',
    'ionic.rating'
])

.run(function($ionicPlatform, $rootScope, $ionicLoading, $state, $ionicHistory, $cordovaNetwork, ionicToast, LoginFactory, SubjectStatisticsFactory, AssignmentFactory, EventsFactory, NotificationsFactory, SmartTestListFactory) {
    $ionicPlatform.ready(function() {
        var isPaused = false;
        if (window.cordova && window.cordova.plugins.Keyboard) {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            // Don't remove this line unless you know what you are doing. It stops the viewport
            // from snapping when text inputs are focused. Ionic handles this internally for
            // a much nicer keyboard experience.
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleLightContent();
        }
        $ionicPlatform.registerBackButtonAction(function(e) {
            if ($state.is('login') || $state.is('menu.dashboard')) {
                if (confirm('Are you sure you want to Exit?')) {
                    ionic.Platform.exitApp();
                    return false;
                } else {
                    e.preventDefault();
                    return false;
                }
            } else if ($state.is('menu.subjectList') || $state.is('menu.smartLearning') || $state.is('menu.assignments') || $state.is('menu.events') || $state.is('menu.notifications') || $state.is('menu.studentDetails') || $state.is('menu.calendar') || $state.is('menu.personalMessage') || $state.is('menu.routeDetails')) {
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                $state.go('menu.dashboard');
            } else if ($state.is('smartTest')) {
                e.preventDefault();
                return false;
            } else {
                $ionicHistory.goBack();
            }
        }, 100);

        $rootScope.$on('$cordovaNetwork:online', function(event, networkState) {
            $ionicLoading.hide();
        });
        $rootScope.$on('$cordovaNetwork:offline', function(event, networkState) {
            $ionicLoading.show({
                template: '<ion-spinner icon="android"></ion-spinner><div>Waiting for network connection...',
                animation: 'fade-in',
                showBackdrop: false,
            });
        });

        if (!$cordovaNetwork.isOnline()) {
            ionicToast.show('There is no network connection..', 'bottom', false, 2500);
        }

        document.addEventListener("pause", function() {
            isPaused = true;
        }, false);

        $ionicPlatform.on('resume', function() {
            if ($state.is('menu.notifications')) {
                $state.reload();
            }
        });

        /* FCMPlugin.onTokenRefresh(function(token) {
            console.log(token);
        }); */

        // FCMPlugin.getToken(function(token) {
        //     LoginFactory.DeviceId = token;
        cordova.getAppVersion(function(version) {
            LoginFactory.AppVersion = version;
            $rootScope.$broadcast('deviceRegistered');
        });
        // });

        /* FCMPlugin.onNotification(
            function(data) {
                if (data.wasTapped) {
                    //Notification was received on device tray and tapped by the user.
                    switch (data.notCode) {
                        case "N001":
                            AssignmentFactory.selectedAssignment = {
                                Id: data.Id,
                                Name: data.Name,
                                Description: data.Description,
                                VideoURL: data.VideoURL,
                                CreatedAt: data.CreatedAt
                            };
                            LoginFactory.NotificationState = "menu.assignments";
                            break;
                        case "N002":
                            EventsFactory.selectedEvent = {
                                Id: data.Id,
                                Name: data.Name,
                                Description: data.Description,
                                VideoURL: data.VideoURL,
                                EventDate: data.EventDate
                            };
                            LoginFactory.NotificationState = "menu.events";
                            break;
                        case "N003":
                            $ionicHistory.nextViewOptions({
                                disableBack: true
                            });
                            LoginFactory.NotificationState = "menu.studentDetails";
                            break;
                        case "N004":
                            NotificationsFactory.selectedNotification = {
                                Id: data.Id,
                                Title: data.Title,
                                Description: data.Description,
                                VideoURL: data.VideoURL,
                                ImageURL: data.ImageURL
                            };
                            LoginFactory.NotificationState = "menu.notifications";
                            break;
                        case "N005":
                            SubjectStatisticsFactory.selected.subject = {
                                ClassId: data.classId,
                                Id: data.subjectId,
                                StudentId: LoginFactory.loggedInUser.Id,
                                Name: data.subjectName
                            };
                            LoginFactory.NotificationState = "menu.dashboard";
                            break;
                        case "N007":
                            SubjectStatisticsFactory.selected.subject = {
                                Id: data.SubjectId
                            };
                            LoginFactory.NotificationState = "menu.subjectList";
                            LoginFactory.NotificationArgs = { toStatistics: 2 };
                            break;
                        case "N008":
                            $ionicHistory.nextViewOptions({
                                disableBack: true
                            });
                            LoginFactory.NotificationState = "menu.studentDetails";
                            break;
                    }
                    $rootScope.$broadcast('userLoggedIn');
                    if (isPaused) {
                        if (data.notCode == "N005") {
                            $state.go(LoginFactory.NotificationState, { toStatistics: 1 });
                        } else if (data.notCode == "N007") {
                            $state.go(LoginFactory.NotificationState, { toStatistics: 2 });
                        } else {
                            $state.go(LoginFactory.NotificationState);
                        }
                    }
                } else {
                    //Notification was received in foreground. Maybe the user needs to be notified. 
                    console.log(JSON.stringify(data));
                }
            },
            function(msg) {
                console.log('onNotification callback successfully registered: ' + msg);
            },
            function(err) {
                console.log('Error registering onNotification callback: ' + err);
            }); */

    });

    $rootScope.$on('loading:show', function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="android"></ion-spinner>',
            animation: 'fade-in',
            showBackdrop: false,
        });
    });

    $rootScope.$on('loading:hide', function() {
        $ionicLoading.hide();
    });

}).config(function($stateProvider, $urlRouterProvider, $httpProvider, ionGalleryConfigProvider, $ionicConfigProvider) {

    ionGalleryConfigProvider.setGalleryConfig({
        action_label: 'Close'
    });

    $ionicConfigProvider.tabs.position('top');
    $ionicConfigProvider.views.swipeBackEnabled(false);

    $httpProvider.interceptors.push(function($rootScope) {
        return {
            request: function(config) {
                $rootScope.$broadcast('loading:show');
                return config;
            },
            requestError: function(requestError) {
                $rootScope.$broadcast('loading:hide');
                return requestError;
            },
            response: function(response) {
                $rootScope.$broadcast('loading:hide');
                return response;
            },
            responseError: function(rejection) {
                $rootScope.$broadcast('loading:hide');
                return rejection;
            }
        }
    });

    $stateProvider
        .state('login', {
            url: '/login',
            cache: false,
            templateUrl: 'app/Login/Login.html',
            controller: 'LoginController'
        })
        .state('register', {
            url: '/register',
            cache: false,
            templateUrl: 'app/Register/Register.html',
            controller: 'RegisterController'
        })
        .state('smartTest', {
            url: '/smartTest/:isComplete',
            cache: false,
            templateUrl: 'app/SmartTest/SmartTest.html',
            controller: 'SmartTestController'
        })
        .state('topicDetails', {
            url: '/topicDetails',
            cache: false,
            templateUrl: 'app/TopicDetails/TopicDetails.html',
            controller: 'TopicDetailsController'
        })
        .state('smartLearning', {
            url: '/smartLearning',
            cache: false,
            templateUrl: 'app/SmartLearning/SmartLearning.html',
            controller: 'SmartLearningController'
        })
        .state('video', {
            url: '/video',
            cache: false,
            templateUrl: 'app/WatchVideo/Video.html',
            controller: 'VideoController'
        })
        .state('menu', {
            abstract: true,
            templateUrl: 'app/Sidemenu/Sidemenu.html',
            controller: 'SidemenuController'
        })
        .state('menu.changePassword', {
            url: '/changePassword',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/ChangePassword/ChangePassword.html',
                    controller: 'ChangePasswordController'
                }
            }
        })
        .state('menu.dashboard', {
            url: '/dashboard',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/Dashboard/Dashboard.html',
                    controller: 'DashboardController'
                }
            }
        })
        .state('menu.subjectList', {
            url: '/subjectList/:toStatistics',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/SubjectList/SubjectList.html',
                    controller: 'SubjectListController'
                }
            }
        })
        .state('menu.studentStatistics', {
            url: '/studentStatistics',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/SubjectStatistics/StudentStatistics/StudentStatistics.html',
                    controller: 'StudentStatisticsController'
                }
            }
        })
        .state('menu.studentAttendance', {
            url: '/studentAttendance',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/SubjectStatistics/StudentAttendance/StudentAttendance.html',
                    controller: 'StudentAttendanceController'
                }
            }
        })
        .state('menu.events', {
            url: '/events',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/Events/EventList/EventList.html',
                    controller: 'EventListController'
                }
            }
        })
        .state('menu.eventDetails', {
            url: '/eventDetails',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/Events/EventDetails/EventDetails.html',
                    controller: 'EventDetailsController'
                }
            }
        })
        .state('menu.assignments', {
            url: '/assignments',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/Assignments/AssignmentList/Assignments.html',
                    controller: 'AssignmentsController'
                }
            }
        })
        .state('menu.assignmentDetails', {
            url: '/assignmentDetails',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/Assignments/AssignmentDetails/AssignmentDetails.html',
                    controller: 'AssignmentDetailsController'
                }
            }
        })
        .state('menu.notifications', {
            url: '/notifications',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/Notifications/NotificationList/Notifications.html',
                    controller: 'NotificationsController'
                }
            }
        })
        .state('menu.personalMessage', {
            url: '/personalMessage',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/PersonalMessage/PersonalMessage.html',
                    controller: 'PersonalMessageController'
                }
            }
        })
        .state('menu.notificationDetails', {
            url: '/notificationDetails',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/Notifications/NotificationDetails/NotificationDetails.html',
                    controller: 'NotificationDetailsController'
                }
            }
        })
        .state('menu.smartTestList', {
            url: '/smartTestList',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/SmartTestList/SmartTestList.html',
                    controller: 'SmartTestListController'
                }
            }
        })
        .state('menu.calendar', {
            url: '/calendar',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/CalendarList/CalendarList.html',
                    controller: 'CalendarListController'
                }
            }
        })
        .state('menu.studentDetails', {
            url: '/studentDetails',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/StudentDetails/StudentDetails.html',
                    controller: 'StudentDetailsController'
                }
            }
        })
        .state('menu.routeDetails', {
            url: '/routeDetails',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/Route/RouteDetails.html',
                    controller: 'RouteDetailsController'
                }
            }
        })
        .state('menu.lessonPlan', {
            url: '/lessonPlan',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/LessonPlan/LessonPlan.html',
                    controller: 'LessonPlanController'
                }
            }
        })
        .state('menu.learningReport', {
            url: '/learningReport',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/LearningReport/LearningReport.html',
                    controller: 'LearningReportController'
                }
            }
        })
        .state('menu.upgradeSkills', {
            url: '/upgradeSkills',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/UpgradeSkills/UpgradeSkills.html',
                    controller: 'UpgradeSkillsController'
                }
            }
        })
        .state('menu.analyseSkills', {
            url: '/AnalyseSkills',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/AnalyseSkills/AnalyseSkills.html',
                    controller: 'AnalyseSkillsController'
                }
            }
        })
        .state('menu.skillsList', {
            url: '/SkillsList',
            cache: false,
            views: {
                'menuContent': {
                    templateUrl: 'app/SkillsList/SkillsList.html',
                    controller: 'SkillsListController'
                }
            }
        });

    $urlRouterProvider.otherwise('/login');

});