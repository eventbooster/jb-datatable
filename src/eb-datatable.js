angular.module('ebBackofficeDatatable', ['eb.apiWrapper'])
    .directive('datatable', function ($location, APIWrapperService) {

        return {
            restrict: 'EA',
            scope: {
                'endpoint': '=',
                'select': '@',
                'labels': '@',
                'fields': '='
            },
            template: '<div class="table-menu" ng-hide="loading">' +
                '<select ng-model="perPage">' +
                '<option value="10">10</option>' +
                '<option value="50">50</option>' +
                '<option value="100">100</option>' +
                '</select>' +
                '<input class="table-filter" type="text" ng-model="filter"/>' +
                '</div>' +
                '<table class="datatable" ng-if="fields" ng-hide="loading">' +
                '<thead>' +
                '<th></th>' +
                '<th ng-repeat="label in tabelLabels">{{label}}</th>' +
                '<th></th>' +
                '<thead>' +
                '<tbody>' +
                '<tr ng-repeat="row in rows">' +
                '<td>{{$index + 1 + ((page-1)*perPage)}}</td>' +
                '<td ng-repeat="col in cols">{{extractColValue(row,col)}}</td>' +
                '<td class="action"><button ng-click="edit(row.id)" class="edit"></button></td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '<button class="prev" ng-click="prev()" ng-show="prevVisible"></button>' +
                '<button class="next" ng-click="next()" ng-show="nextVisible"></button>' +
                '<div class="no-entries notification" ng-show="!hasEntries() && !loading" tabindex="web.backoffice.datatable.notentries"></div>' +
                '<div class="progress progress-striped active"  ng-show="loading">' +
                '<div class="progress-bar progress-bar" role="progressbar" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100" style="width: 100%" translate="web.backoffice.loading"></div>' +
                '</div>',
            controller: function ($scope, $http) {

                $scope.loading = true;
                $scope.page = 1;
                $scope.perPage = 50;
                $scope.prevVsisible = false;
                $scope.nextVisible = false;

                $scope.extractColValue = function (obj, path) {

                    var pathElements = path.split('.');

                    angular.forEach(pathElements, function (pathElement, index) {

                        // check if there are any constraints
                        var constraint = pathElement.match(/\[(.*?)\]/);

                        if (constraint) {

                            var constraintField = constraint[1].split('=')[0];
                            var constraintValue = constraint[1].split('=')[1];

                            pathElement = pathElement.substr(0, pathElement.indexOf('['));

                        }

                        if ($.isArray(obj[pathElement])) {

                            if (constraint) {

                                angular.forEach(obj[pathElement], function (elem) {

                                    if (elem[constraintField].toString() === constraintValue) {
                                        obj = elem;
                                    }

                                });

                            } else {

                                obj = obj[pathElement][ pathElements[index + 1]];

                            }

                        } else {

                            if (obj[pathElement] === undefined) {
                                return '';
                            }

                            obj = obj[pathElement];
                        }

                    });

                    return (typeof obj === 'object') ? '' : obj;

                };

                $scope.updateTable = function () {

                    $scope.tabelLabels = $scope.labels.split(',');
                    $scope.cols = $scope.fields.split(',');

                    var rangeMin = $scope.page * $scope.perPage - $scope.perPage;
                    var rangeMax = $scope.page * $scope.perPage;
                    var range = rangeMin + '-' + rangeMax;

                    var config = {
                        headers: {
                            range: range,
                            select: $scope.select
                        }
                    };

                    if ($scope.filter) {
                        config.headers.filter = $scope.cols[0] + '= like(\'%' + $scope.filter + '%\')';
                    }

                    APIWrapperService.request({
                            url: $scope.endpoint,
                            method: "GET",
                            headers: config.headers
                        },
                        {
                            returnProperty: function (resp) {
                                return resp;
                            }
                        })
                        .then(

                        function (data) {

                            $scope.loading = false;

                            $scope.rows = data;

                            $scope.prevVisible = $scope.page > 1;
                            $scope.nextVisible = data.length >= $scope.perPage;

                        },
                        function (error) {

                            $rootScope.$broadcast('notification', {"type": "error", "message": "web..backoffice.loading.error"});

                        }

                    );
                };

                $scope.setRange = function (callback) {
                    var rangeMin = $scope.page * $scope.perPage - $scope.perPage;
                    var rangeMax = $scope.page * $scope.perPage;

                    $http.defaults.headers.get.range = rangeMin + '-' + rangeMax;

                    if (callback) {
                        callback();
                    }
                };

                $scope.hasEntries = function () {
                    if ($scope.rows && $scope.rows.length > 0) {
                        return true;
                    }
                    return false;
                };

            },
            link: function (scope, elem, attrs) {

                /**
                 * Routes to edit page.
                 * @param id
                 */
                scope.edit = function (id) {
                    $location.path($location.path() + '/' + id);
                };

                /**
                 * Loads previous page.
                 */
                scope.prev = function () {
                    if (scope.page > 1) {
                        scope.prevVisible = false;
                        scope.page--;
                    }
                };

                /**
                 * Loads next page.
                 */
                scope.next = function () {
                    if (scope.rows.length >= scope.perPage) {
                        scope.nextVisible = false;
                        scope.page++;
                    }
                };

                /**
                 * Watchs the perPage and page. Refresh the datatable.
                 */
                scope.$watchCollection('[perPage, page, fields,filter]', function (newValue, oldValue) {
                    if (scope.fields) {
                        scope.updateTable();
                    }
                });

            }
        };


    });