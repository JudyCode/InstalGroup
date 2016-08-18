(function () {

    'use strict';

    angular.module('instaGroups', ['ngRoute', 'ui.bootstrap'])

    .factory('InstagramService', ['$http',
        function($http) {
            var baseURL = 'https://api.instagram.com';
            var client_id = '706d2006129147cbba58691c8ffcc20a';
            var redirect_uri = 'http://localhost:8000';
            // for test, use '2274694953.706d200.29b7eed5f7654232a2d6cc3ebd7c7977', @happy0305
            var access_token = '2274694953.706d200.29b7eed5f7654232a2d6cc3ebd7c7977';

            var service = {
                setAccessToken: function(accessToken) {
                    access_token = accessToken;
                },
                gotoAuth: function() {
                    return window.open(baseURL + '/oauth/authorize/?client_id=' + client_id +
                        '&redirect_uri=' + redirect_uri + '&response_type=token', 'authorizeWindow');
                },
                getLoggedInUser: function(callback){
                    var endPoint = baseURL + '/v1/users/self?' + 
                        'access_token=' + access_token + '&callback=JSON_CALLBACK';
                    $http.jsonp(endPoint).success(function(response) {
                        callback(response.data);
                    });
                },
                searchUsers: function(userName, callback){
                    var endPoint = baseURL + '/v1/users/search?q=' + userName + 
                        '&access_token=' + access_token + '&callback=JSON_CALLBACK';
                    $http.jsonp(endPoint).success(function(response) {
                        callback(response.data);
                    });
                },
                searchPopularMedia: function(callback) {
                    var endPoint = baseURL + '/v1/media/popular?access_token=' + access_token + 
                        '&callback=JSON_CALLBACK';
                    $http.jsonp(endPoint).success(function(response) {
                        callback(response.data);
                    });
                },
                searchRecentMedia: function(user, callback) {
                    var endPoint = baseURL + '/v1/users/' + user.id + '/media/recent/?access_token=' + access_token + 
                        '&callback=JSON_CALLBACK';
                    $http.jsonp(endPoint).success(function(response) {
                        callback(response.data);
                    });
                },
                searchMediaByTag: function(tag, callback) {
                    var endPoint = baseURL + '/v1/tags/' + tag + '/media/recent?access_token=' + access_token + 
                        '&callback=JSON_CALLBACK';
                    $http.jsonp(endPoint).success(function(response) {
                        callback(response.data);
                    });
                },
                searchMediaByLocationAndTime: function(location, time, callback) {
                    var endPoint = baseURL + '/v1/media/search?lat=' + location.lat + 
                        '&lng=' + location.lng;
                    if (time != null && time.maxTimestamp != null) {
                        endPoint += '&max_timestamp=' + time.maxTimestamp;
                    }
                    if (time != null && time.minTimestamp != null) {
                        endPoint += '&min_timestamp=' + time.minTimestamp;
                    }
                    endPoint += '&access_token=' + access_token + '&callback=JSON_CALLBACK';
                    $http.jsonp(endPoint).success(function(response) {
                        callback(response.data);
                    });
                }
            };

            return service;
        }
    ])

    .factory('GeocoderService', function() {
        var geocoder = new google.maps.Geocoder();

        var service = {
            codeAddress: function(address, callback) {
                geocoder.geocode( { 'address': address}, function(results, status) {
                    var geoLocation = null;
                    if (results.length > 0) {
                        geoLocation= {};
                        geoLocation.formattedAddress = results[0].formatted_address;
                        geoLocation.lat = results[0].geometry.location.lat();
                        geoLocation.lng = results[0].geometry.location.lng();
                    }
                    callback(status, geoLocation);
                });
            }
        }
        return service;
    })

    .service('DataService', function() {
        var loggedinUser = {};
        var groups = {};
        var previousState = {
            groups: {},
            users: {},
            media: {}
        };
        
        this.setLoggedInUser = function(user) {
            loggedinUser = user;
        };

        this.getLoggedInUser = function() {
            return loggedinUser;
        };

        this.getGroup = function(groupName) {
            return groups[groupName];
        };

        this.getAllGroups = function() {
            return groups;
        };

        this.addGroup = function(groupName) {
            if (!groups.hasOwnProperty(groupName)) {
                groups[groupName] = [];
            }
        };

        this.updateGroupName = function(oldGroupName, newGroupName) {
            groups[newGroupName] = groups[oldGroupName];
            delete groups[oldGroupName];
        };

        this.deleteGroup = function(groupName) {
            if (groups.hasOwnProperty(groupName)) {
                delete groups[groupName];
            }
        };

        this.addUserToGroup = function(user, groupName) {
            if (!groups.hasOwnProperty(groupName)) {
                groups[groupName] = [];
            }
            if (groups[groupName].indexOf(user) == -1) {
                groups[groupName].push(user);
            }
        };

        this.deleteUserFromGroup = function(user, groupName) {
            if (groups.hasOwnProperty(groupName)) {
                if (groups[groupName].indexOf(user) > -1) {
                    groups[groupName].splice(groups[groupName].indexOf(user), 1);
                }
            }
        };

        this.saveCurrentUsersSearch = function(userName, users) {
            previousState.users.userName = userName;
            if (users == undefined) {
                users = [];
            }
            previousState.users.users = users;
        };

        this.getPreiousUsersSearch = function() {
            return previousState.users;
        };

        this.saveCurrentMediaSearch = function(selectedItem, searchInput, mediaList) {
            previousState.media.selectedItem = selectedItem;
            previousState.media.searchInput = searchInput;
            if (mediaList == undefined) {
                mediaList = [];
            }
            previousState.media.mediaList = mediaList;
        };

        this.getPreiousMediaSearch = function() {
            return previousState.media;
        };
    })

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/home', {
                templateUrl : 'partials/home.html',
                controller  : 'instaGroupsController'
            })

            .when('/groups', {
                templateUrl : 'partials/groups.html',
                controller  : 'groupsController'
            })

            .when('/users', {
                templateUrl : 'partials/users.html',
                controller  : 'usersController'
            })

            .when('/media', {
                templateUrl : 'partials/media.html',
                controller  : 'mediaController'
            })

            .otherwise({redirectTo: '/home'});
    }])

    .directive('userInfo', function() {
      return {
        restrict: 'AE',
        scope: {
          user: '='
        },
        controller: 'userInfoController',
        templateUrl: 'partials/userInfo.html'
      };
    })

    .directive('mediaInfo', function() {
      return {
        restrict: 'AE',
        scope: {
          media: '='
        },
        controller: 'mediaInfoController',
        templateUrl: 'partials/mediaInfo.html'
      };
    })

    .controller('instaGroupsController', ['$scope', '$timeout', 'InstagramService', 'DataService',
        function($scope, $timeout, InstagramService, DataService) {
            $scope.welcomeMessageTitle = 'Welcome to InstaGroups!';
            $scope.welcomeMessageBody = 'Create your own groups with Instagram, share and enjoy! ' + 
                                        'Find your friends by searching users and discover variety ' + 
                                        'and colorful media over the world.';
            $scope.signedInMessage = 'Signed in successfully!';
            // for test, use '2274694953.706d200.29b7eed5f7654232a2d6cc3ebd7c7977', @happy0305
            $scope.accessToken = '2274694953.706d200.29b7eed5f7654232a2d6cc3ebd7c7977';

            // for test, initialize the logged-in user
            InstagramService.getLoggedInUser(function(data) {
                DataService.setLoggedInUser(data);
            });

            $scope.loggedinUser = DataService.getLoggedInUser;

            $scope.signIn = function() {
                var authorizeWindow = InstagramService.gotoAuth();
                var checkSignIn =function() {
                    try {
                        var redirectUrl = authorizeWindow.location.href;
                        if (redirectUrl.search('access_token') >= 0) {
                            $scope.accessToken = redirectUrl.split('access_token=')[1];
                            InstagramService.setAccessToken($scope.accessToken);
                            InstagramService.getLoggedInUser(function(data) {
                                DataService.setLoggedInUser(data);
                            });
                        }
                        authorizeWindow.close();
                    } catch (err) {/* do nothing */}
                };
                for (var delayInMillis = 1000; delayInMillis < 10000; delayInMillis += 1000) {
                  $timeout(checkSignIn, delayInMillis);
                }
            };

            $scope.isActive = function(locationHash) {
                return location.hash.endsWith(locationHash);
            };
        }
    ])

    .controller('groupsController', ['$scope', '$location', 'DataService', 
        function($scope, $location, DataService) {
            $scope.title = 'Groups!';
            $scope.introMsg = 'Create and manage your groups. Click the group to view more details. Enjoy!!';
            $scope.focusGroup = {};

            $scope.createGroup = function() {
                if (!$scope.newGroupName) {
                    $scope.invlaidGroupName = true;
                } else {
                    $scope.invlaidGroupName = false;
                    DataService.addGroup($scope.newGroupName);
                }
            };

            $scope.getGroups = function() {
                return DataService.getAllGroups();
            };

            $scope.getGroup = DataService.getGroup;

            $scope.setFocusGroup = function(groupName, group) {
                $scope.focusGroup.groupName = groupName;
                $scope.focusGroup.group = group;
                $scope.showEditGroupNameSection = false;
            };

            $scope.deleteGroup = function(groupName) {
                DataService.deleteGroup(groupName);
                if ($scope.focusGroup.groupName === groupName) {
                    $scope.focusGroup.groupName = null;
                }
            };

            $scope.deleteUserFromGroup = function(user, groupName) {
                DataService.deleteUserFromGroup(user, groupName);
                $scope.focusGroup.group = DataService.getGroup(groupName);
            };

            $scope.setEditGroupNameSection = function() {
                $scope.showEditGroupNameSection = true;
            };

            $scope.updateGroupName = function() {
                if($scope.groupNameToUpdate) {
                    $scope.isInvalidUpdatedGroupName = false;
                    if ($scope.focusGroup.groupName !== $scope.groupNameToUpdate && DataService.getGroup($scope.groupNameToUpdate) === undefined) {
                         DataService.updateGroupName($scope.focusGroup.groupName, $scope.groupNameToUpdate);
                        $scope.focusGroup.groupName = $scope.groupNameToUpdate;
                        $scope.groupNameToUpdate = null;
                    }
                } else {
                    $scope.isInvalidUpdatedGroupName = true;
                }
            };

            $scope.cancelUpdateGroupName = function() {
                $scope.showEditGroupNameSection = false;
                $scope.groupNameToUpdate = null;
                $scope.isInvalidUpdatedGroupName = false;
            }

            $scope.goToUsersNav = function() {
                DataService.saveCurrentUsersSearch(null, {});
                $location.path('/users');
            };
        }
    ])

    .controller('usersController', ['$scope', 'InstagramService', 'DataService', 
        function($scope, InstagramService, DataService) {
            $scope.title = 'Users!';
            $scope.introMsg = 'Find your friends by searching with user name! You can add the user to new or existing group' +
                ' and view the recent media posted by that user.';
            $scope.search = {};
            var previousState = DataService.getPreiousUsersSearch();
            $scope.search.requestUserName = previousState.userName;
            $scope.search.resultUsers = previousState.users;

            $scope.searchUsers = function() {
                if (!$scope.search.requestUserName || /^\s*$/.test($scope.search.requestUserName)) {
                    $scope.invlaidUserName = true;
                } else {
                    $scope.invlaidUserName = false;
                    InstagramService.searchUsers($scope.search.requestUserName, function(data) {
                        $scope.search.resultUsers = data;
                        DataService.saveCurrentUsersSearch($scope.search.requestUserName, data);
                    });
                }
            };
        }
    ])

    .controller('mediaController', ['$scope', 'InstagramService', 'DataService', 'GeocoderService', 
        function($scope, InstagramService, DataService, GeocoderService) {
            $scope.title = 'Media!';
            $scope.introMsg = 'Media! Media! Media!!! View your own recent media and search for media by tag, ' + 
                'time uploaded, most popular right now, or geographic location. Add the user(s) ' + 
                'who posted the media to a new or existing group by clicking "Add user to group" button.';
            $scope.items = ['Search most popular', 'Search recent (default: yourself)', 'Search by tags', 'Search by location and time'];
            $scope.selectedItem = $scope.items[0];
            $scope.search = {};
            var preiousState = DataService.getPreiousMediaSearch();
            if (preiousState.selectedItem) {
                $scope.selectedItem = preiousState.selectedItem;
            }
            $scope.search.requestInput = preiousState.searchInput;
            $scope.search.resultMedia = preiousState.mediaList;

            $scope.searchMedia = function() {
                if ($scope.selectedItem === $scope.items[0]) {
                    InstagramService.searchPopularMedia(function(data) {
                        $scope.search.resultMedia = data;
                        DataService.saveCurrentMediaSearch($scope.selectedItem, $scope.search.requestInput, data);
                    });
                } else if ($scope.selectedItem === $scope.items[1]) {
                    InstagramService.searchRecentMedia(DataService.getLoggedInUser(), function(data) {
                        $scope.search.resultMedia = data;
                        DataService.saveCurrentMediaSearch($scope.selectedItem, $scope.search.requestInput, data);
                    });
                } else if ($scope.selectedItem === $scope.items[2]) {
                    if (!$scope.search.requestInput || /^\s*$/.test($scope.search.requestInput)) {
                        $scope.invlaidTagName = true;
                    } else {
                        $scope.invlaidTagName = false;
                        InstagramService.searchMediaByTag($scope.search.requestInput, function(data) {
                            $scope.search.resultMedia = data;
                            DataService.saveCurrentMediaSearch($scope.selectedItem, $scope.search.requestInput, data);
                        });
                    }
                } else if ($scope.selectedItem === $scope.items[3]) {
                    if (!$scope.search.requestInput || /^\s*$/.test($scope.search.requestInput)) {
                        $scope.invlaidLocation = true;
                        $scope.search.showSuccessfulGeoInfo = false;
                        $scope.search.showFailedGeoInfo = false;
                        $scope.search.showInvalidDatesInfo = false;
                    } else {
                        $scope.invlaidLocation = false;
                        if(!$scope.validDates()) {
                            $scope.search.showInvalidDatesInfo = true;
                        } else {
                            $scope.search.showInvalidDatesInfo = false;
                            GeocoderService.codeAddress($scope.search.requestInput, function(status, data) {
                                $scope.search.geoStatus = status;
                                $scope.search.geoLocation = data;

                                if (status === google.maps.GeocoderStatus.OK) {
                                    $scope.search.showSuccessfulGeoInfo = true;
                                    $scope.search.showFailedGeoInfo = false;
                                    var time = {};
                                    if ($scope.startDate != null) {
                                        time.minTimestamp = new Date($scope.startDate).getTime() / 1000;
                                    }
                                    if ($scope.endDate != null) {
                                        time.maxTimestamp = new Date($scope.endDate).getTime() / 1000;
                                    }

                                    InstagramService.searchMediaByLocationAndTime($scope.search.geoLocation, time, 
                                        function(data) {
                                            $scope.search.resultMedia = data;
                                            DataService.saveCurrentMediaSearch($scope.selectedItem, $scope.search.requestInput, data);
                                        }
                                    );
                                } else {
                                    $scope.search.showSuccessfulGeoInfo = false;
                                    $scope.search.showFailedGeoInfo = true;
                                }
                            });
                        }
                    }
                }
            };

            $scope.processSelection = function(item) {
                $scope.selectedItem = item;
                delete $scope.search.requestInput;
            };

            $scope.disableSearchInput = function() {
                // disable input when search popular and recent media
                if ($scope.selectedItem === $scope.items[0] || $scope.selectedItem === $scope.items[1]) {
                    return true;
                } else {
                    return false;
                }
            };

            $scope.getInputPlaceHolder = function() {
                if ($scope.selectedItem === $scope.items[0] || $scope.selectedItem === $scope.items[1]) {
                    return 'Go! Input is not needed.';
                } else if ($scope.selectedItem === $scope.items[2]) {
                    return 'tag name, for example "thanksgiving"';
                } else if ($scope.selectedItem === $scope.items[3]) {
                    return 'location, for example "New York"';
                }
            };

            // below is for date picker
            $scope.format = 'yyyy/MM/dd';
            $scope.dateOptions = {
                'year-format': 'yy',
                'show-weeks' : false
            };
            $scope.startDatePickerOpened = false;
            $scope.endDatePickerOpened = false;
  
            $scope.startDatePickerOpen = function(event){
                event.preventDefault();
                event.stopPropagation();
                $scope.startDatePickerOpened = true;
            };

            $scope.endDatePickerOpen = function(event){
                event.preventDefault();
                event.stopPropagation();
                $scope.endDatePickerOpened = true;
            };

            $scope.validDates = function() {
                var startDate = $scope.startDate == null ? null : new Date($scope.startDate).getTime();
                var endDate = $scope.endDate == null ? null : new Date($scope.endDate).getTime();
                if (startDate != null && endDate != null && startDate >= endDate) {
                    return false;
                }
                return true;
            };
        }
    ])

    .controller('userInfoController', ['$scope', '$location', 'InstagramService', 'DataService', 
        function($scope, $location, InstagramService, DataService){
            $scope.setAddToGroupSection = function() {
                $scope.showAddToGroupSection = true;
            };

            $scope.addUserToGroup = function() {
                if ($scope.groupNameToAddUser) {
                    $scope.showEmptyNameError = false;
                    DataService.addUserToGroup($scope.user, $scope.groupNameToAddUser);
                    $scope.showSuccessfulMessage = true;
                } else {
                    $scope.showEmptyNameError = true;
                    $scope.showSuccessfulMessage = false;
                }
            };

            $scope.cancelAddUserToGroup = function() {
                $scope.showAddToGroupSection = false;
                $scope.groupNameToAddUser = null;
                $scope.showEmptyNameError = false;
                $scope.showSuccessfulMessage = false;
            };

            $scope.viewRecentMedia = function() {
                InstagramService.searchRecentMedia($scope.user, function(data) {
                    var selectedItem = 'Search recent (default: yourself)';
                    DataService.saveCurrentMediaSearch(selectedItem, null, data);
                    $location.path('/media');
                });
            };
        }
    ])

    .controller('mediaInfoController', ['$scope', 'InstagramService', 'DataService', 
        function($scope, InstagramService, DataService) {
            // get up to 5 tags
            $scope.getTagList = function() {
                var tagList = [];
                angular.forEach($scope.media.tags, function(value) {
                    tagList.push(value);
                });
                if (tagList.length > 5) {
                    tagList = tagList.slice(0, 5);
                    $scope.hasMoreTags = true;
                } else {
                    $scope.hasMoreTags = false;
                }
                return tagList;
            };

            $scope.setAddToGroupSection = function() {
                $scope.showAddToGroupSection = true;
            };

            $scope.addUserToGroup = function() {
                if ($scope.groupNameToAddUser) {
                    $scope.showEmptyNameError = false;
                    DataService.addUserToGroup($scope.media.user, $scope.groupNameToAddUser);
                    $scope.showSuccessfulMessage = true;
                } else {
                    $scope.showEmptyNameError = true;
                    $scope.showSuccessfulMessage = false;
                }
            };

            $scope.cancelAddUserToGroup = function() {
                $scope.showAddToGroupSection = false;
                $scope.groupNameToAddUser = null;
                $scope.showEmptyNameError = false;
                $scope.showSuccessfulMessage = false;
            };
        }
    ]);
})();