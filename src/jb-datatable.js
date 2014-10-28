angular.module('jb.datatable', ['eb.apiWrapper'])
    
    .directive('datatable', [ '$compile', '$location', 'APIWrapperService', function ( $compile, $location, APIWrapperService) {

        return {
            restrict: 'EA',
            scope: {
                'endpoint'  : '=',
                'select'    : '@',
                'labels'    : '@',
                'fields'    : '=',
                'order'     : '@',
                'tableClass': '@'
            },
            template: '<div class="table-menu" ng-hide="loading">' +
                '<select ng-model="perPage">' +
                '<option value="10">10</option>' +
                '<option value="50">50</option>' +
                '<option value="100">100</option>' +
                '</select>' +
                '<input class="table-filter" type="text" ng-model="filter"/>' +
                '</div>' +
                '<table class="datatable {{tableClass}}" ng-if="fields" ng-hide="loading">' +
                '<thead>' +
                '<th ng-repeat="label in tableLabels">{{label}}</th>' +
                '<th></th>' +
                '<thead>' +
                '<!-- Content will be added here through link function -->' +
                '<tbody>' +
                '</tbody>' +
                '</table>' +
                '<button class="prev" ng-click="prev()" ng-show="prevVisible">Previous</button>' +
                '<button class="next" ng-click="next()" ng-show="nextVisible">Next</button>' +
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



                /**
                * Get new data from server, store in $scope.rows
                * Called on change of perPage, page, fields etc.
                */
                $scope.updateTable = function () {

                    console.log( "Update table" );

                    $scope.tableLabels = $scope.labels.split(',');

                    var rangeMin = $scope.page * $scope.perPage - $scope.perPage;
                    var rangeMax = $scope.page * $scope.perPage;
                    var range = rangeMin + '-' + rangeMax;

                    var config = {
                        headers: {
                            range: range,
                            select: $scope.select,
                            order: $scope.order
                        }
                    };

                    if ($scope.filter) {
                        config.headers.filter = $scope.fields[0] + '= like(\'%' + $scope.filter + '%\')';
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

                            console.log( "Got data" );

                            $scope.loading = false;

                            $scope.rows = data;

                            $scope.prevVisible = $scope.page > 1;
                            $scope.nextVisible = data.length >= $scope.perPage;

                        },
                        function (error) {

                            $rootScope.$broadcast('notification', {"type": "error", "message": "web.backoffice.loading.error"});

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





                ////////////////////////////////////////////////////////////////////////
                //
                // RENDER TABLE
                //
                ////////////////////////////////////////////////////////////////////////


                /**
                * Watch for changes in server data
                */
                scope.$watch( "rows", function( newData ) {
                    renderTableContents( newData );
                } );


                /**
                * Render content of $scope.rows in table (<tr><td> etc.)
                *
                * We can't use: 
                * - Bindings, as they won't compile their content; e.g. click handlers won't be called
                * - A ng-bind-html-and-compile directive as it's watcher will not perform well 
                *   (See http://stackoverflow.com/questions/17417607/angular-ng-bind-html-unsafe-and-directive-within-it)
                *
                * @param <Object> data      Data as gotten from server
                */
                function renderTableContents( data ) {

                    console.log( "Render table content" );
        
                    var content = $();

                    angular.forEach( data, function( row ) {

                        var tr = $( "<tr></tr>" );

                        angular.forEach( scope.fields, function( field ) {

                            var cellValue;

                            if( angular.isFunction( field ) ) {
                                cellValue = field( row );
                            }
                            else {
                                cellValue = getObjectPropertyFromPath( field, row );
                            }

                            var td = $( "<td>" + cellValue + "</td>" );
                            tr.append( td );
                            $compile( td )( scope );


                        } );

                        content = content.add( tr );
                        
                    } );

                    elem.find( "tbody" )
                        .empty()
                        .append( content );

                }



                /**
                * Returns a property from obj defined by path (like xPath): 
                * @param <String> path      Path definition, e.g. "address.0.firstName"
                *                           TBD: How may paths look like?
                * @param <String> obj       Object to retreive property from
                */
                function getObjectPropertyFromPath( path, obj ) {

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

                }


                /**
                * Reload table when «reloadDatatableData» is received; call by using
                * $rootScope.$broadcast( "reloadDatatableData" );
                */
                scope.$on( "reloadDatatableData", function( ev, data ) {
                    scope.updateTable();
                } );


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
                scope.$watchCollection('[perPage, page, fields, filter]', function (newValue, oldValue) {
                    if (scope.fields) {
                        scope.updateTable();
                    }
                });

            }
        };


    } ] );