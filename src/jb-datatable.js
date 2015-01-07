'use strict';

angular
.module( 'jb.datatable', [ 'eb.apiWrapper' ] )






.directive( 'datatable-with-filters', function() {

} )
.controller( 'DatatableWithFiltersController', [ '$scope', function( $scope ) {

} ] )














/**
* Directive to render table (without filter inputs etc.)
*/
.directive( 'datatable', function() {

    return {

        link: function( scope, element, attrs, datatableController ) {

            datatableController.init( element );

        }
        , controller: 'DatatableController'
        , scope: {} 

    }

} )

.controller( 'DatatableController', [ '$scope', '$rootScope', '$attrs', '$templateCache', '$compile', 'APIWrapperService', function( $scope, $rootScope, $attrs, $templateCache, $compile, APIWrapperService ) {

    var self    = this
        , scope = $scope.$new();


    // Pass original scope down to cell where it might be used by
    // rendering functions
    scope.originalScope = $scope.$parent;


    /**
    * Corresponds to directive's link function; render template
    */
    this.init = function( element ) {

        self.$element = element;


        // Render template
        var template    = $templateCache.get( 'datatableTemplate.html' )
            , rendered  = $compile( template )( scope );
        
        self.$element
            .empty()
            .append( rendered )

    }



    // Watch for endpoint, order or filter to change: 
    // call getData()
    $attrs.$observe( function() {
        return $scope.$parent.$eval( $attrs.endpoint ) + $scope.$parent.$eval( $attrs.filter ) + $scope.$parent.$eval( $attrs.order ) + $scope.$parent.$eval( $attrs.fields );
    }, function( newVal ) {

        scope.fields = $scope.$parent.$eval( $attrs.fields );
        self.getData();

    } );


    // Watch for changes in $scope.label
    $attrs.$observe( function() {
        return $scope.$parent.$eval( $attrs.labels ) 
    }, function( newVal ) {
        scope.labels = $scope.$parent.$eval( $attrs.labels );
    } );


    



    /**
    * Gets data from server
    */
    this.getData = function() {

        // Generate headers
        var headers     = {};
        /*[ 'select', 'order' ].forEach( function( item ) {
            headers[ item ] = $attrs[ item ];
        } );*/
        headers.order = $attrs.order;
        headers.select = getSelectFromFields();
        console.log( 'Datatable: headers are %o', headers );

        var url = $scope.$parent.$eval( $attrs.endpoint );
        console.log( 'Datatable: call URL %o', url );

        // Call
        APIWrapperService.request( {
            url         : url
            , method    : 'GET'
            , headers   : headers
        } )
        .then( function( data ) {

            console.log( 'Datatable: Set tableData to %o', data );
            scope.tableData = data;

        }, function() {

            $rootScope.$broadcast( 'notification', { 'type': 'error', 'message': 'web.backoffice.loading.error' } );

        } );

    }


    // Parse fields to find out what select headers we have to set
    function getSelectFromFields() {
        return '*';
    }



} ] )






/**
* Directive to render datatable's <tbody> (containing al <tr>s)
*/
.directive( 'datatableBody', function() {
    return {
        templateUrl     : 'datatableRowTemplate.html'
        , controller    : 'DatatableBodyController'
        , require       : ['^datatable', 'datatableBody' ]
        , scope         : {}
        , link          : function( $scope, element, attrs, ctrl ) {
            
            ctrl[ 1 ].init( element, ctrl[ 0 ], ctrl[ 1 ] )

        }
    }
} )

.controller( 'DatatableBodyController', [ '$scope', '$templateCache', '$compile', function( $scope, $templateCache, $compile ) {

    var scope   = $scope.$new()
        , self  = this;

    scope.bodyData = [];


    var element
        , datatableController;


    this.init = function( el, dtController, datatableBodyController ) {

        element = el;
        datatableController = dtController;

        // Render rows as soon as element is available
        self.renderRows();

    }



    // Watch for changes in tableData; render row (as soon as element is available)
    $scope.$watch( '$parent.tableData', function() {
        scope.bodyData = $scope.$parent.tableData;
        console.log( 'Datatable: bodyData is %o', scope.bodyData );
        self.renderRows();
    } );



    this.renderRows = function() {

        if( !element || !scope.bodyData ) {
            return;
        }

        element.empty();

        scope.bodyData.forEach( function( row ) {
            
            var template = $templateCache.get( 'datatableRowTemplate.html' );

            // Generate new scope for row
            var rowScope = $scope.$new();
            rowScope.data = row;
            rowScope.originalScope = $scope.$parent.originalScope;
            rowScope.fields = $scope.$parent.fields;

            var renderedRow = $compile( template )( rowScope );

            element.append( renderedRow );

        } );

    }

} ] )







/**
* Directive to render a datatable's row and it's contents
*/
.directive( 'datatableRow', function() {
    return {
        link            : function( $scope, element, attrs, ctrl ) {
            ctrl.init( element );
        }
        , controller    : 'DatatableRowController'
        , scope         : {}
    }
} )

.controller( 'DatatableRowController', [ '$scope', '$templateCache', '$compile', function( $scope, $templateCache, $compile ) {

    var self        = this;

    // Define variables
    self.data;
    self.fields;
    self.$element;

    // On change of data or fields update cells
    $scope.$watchGroup( [ '$parent.data', '$parent.fields' ], function() {

        self.renderCells();

        self.data       = $scope.$parent.data;
        self.fields     = $scope.$parent.fields;

        self.renderCells();

    } );


    // Called by link function
    this.init = function( element ) {
        self.$element = element;
        self.renderCells();
    }

    // Renders cells with their new scope
    this.renderCells = function() {

        if( !angular.isArray( self.fields ) ) {
            return;
        }

        if( !self.$element ) {
            return;
        }

        self.$element.empty();

        self.fields.forEach( function( cellField ) {

            var cellScope           = $scope.$new();
            cellScope.field         = cellField;
            cellScope.data          = self.data;
            cellScope.originalScope = $scope.$parent.originalScope;

            var template    = $templateCache.get( 'datatableCellTemplate.html' )
                , rendered  = $compile( template )( cellScope );

            self.$element.append( rendered );

        } );

    }

} ] )







/**
* Directive for a single cell
*/
.directive( 'datatableCell', function() {

    return {
        controller  : 'DatatableCellController'
        , link      : function( scope, element, attrs, ctrl  ) {
            ctrl.init( element );
        }
    }

} )

.controller( 'DatatableCellController', [ '$scope', '$compile', '$templateCache', function( $scope, $compile, $templateCache ) {

    var self        = this;

    self.$element;


    $scope.$watchGroup( [ 'data', 'field' ], function() {
        self.renderCellContent();
    } );



    this.init = function( element ) {

        self.$element = element;
        self.renderCellContent();

    }


    this.renderCellContent = function() {

        var content = getDataByField( $scope.data, $scope.field )
        console.error( $scope.originalScope );

        self.$element
            .empty()

            // Span's needed as angular won't compile without an enclosing tag
            // Don't use a proper template, as we'd need data-ng-bind-html and therefore
            // the angular Sanitizer.
            // Compile against the originalScope so that one may use $scope in the fields
            // definition for ng-click etc.
            .append( $compile( '<span>' + content + '</span>' )( $scope.originalScope ) ); 

    }



    /*
    * «xpath» for objects. Returns result found in data for a certain path «field».
    * field may be 
    * - name1.name2.name3   for { name1: { name2: { name3: } } }
    * - name.0.content      for { name1: [ { content: } ] }
    * - name=test.content   for { name: test, content: { } }
    */
    function getDataByField( data, field ) {

        if( angular.isFunction( field ) ) {
            return field( data );
        }


        // Holds data of last parsed field
        var fieldData   = data
            , paths     = field.split( '.' )
            , result;

        for( var i = 0; i < paths.length; i++ ) {

            var currentPath = paths[ i ];
            console.log( "Find %o in %o", currentPath, fieldData );

            // Property is missing
            if( !fieldData[ currentPath ] ) {
                console.log( 'prop missing' );
                result = false;
                break;
            }


            // fieldData[ currentPath ] is object or array
            if( angular.isObject( fieldData[ currentPath ] ) || angular.isArray( fieldData[ currentPath ] ) ) {

                fieldData = fieldData[ currentPath ];
                continue;

            }


            // fieldData[ currentPath ] is string, number, etc.

            // path was last element in paths: Return result
            if( i === paths.length - 1 ) {
                result = fieldData[ currentPath ];
            }

            // path was not last element in paths: path couldn't be found,
            // return false
            else {
                console.log( 'string not last' );
                result = false;
            }

        }

        console.error( "result: %o", result );
        return result;
            
    }


} ] ) 








/**
* Renders a date. Requires attributes
* - data-date-renderer
* - data-date-format (YYYY, YY, MM, DD, hh, mm, ss)
* - data-date (some parsable date)
*/
.directive( 'dateRenderer', function() {

    return {
        link: function( $scope, element, attrs ) {

            var format = attrs.dateFormat
                , date = new Date( attrs.date )

            var tableDate = format
                .replace( 'YYYY', date.getFullYear() )
                .replace( 'YY', date.getYear() )
                .replace( 'MM', date.getMonth() + 1 )
                .replace( 'DD', date.getDate() )

                .replace( 'hh', pad( date.getHours() ) )
                .replace( 'mm', pad( date.getMinutes() ) )
                .replace( 'ss', pad( date.getSeconds() ) )
    
            element
                .empty()
                .append( tableDate )

            function pad( nr ) {
                return nr < 10 ? '0' + nr : nr;
            }

        }
    }

} )





/**
* Template for table
*/
.run( function( $templateCache ) {

    $templateCache.put( 'datatableTemplate.html', 
          '<table class=\'table\'>'
        + '<thead>'
        + '<tr>'
        + '<th data-ng-repeat=\'label in labels\'>{{label}}</th>'
        + '</tr>'
        + '</thead>'
        + '<tbody data-datatable-body>'
        + '</tbody>'
        + '</table>'
    )

    $templateCache.put( 'datatableRowTemplate.html', 
          '<tr data-datatable-row></tr>'
    )

    $templateCache.put( 'datatableCellTemplate.html', 
          '<td data-datatable-cell>'
        + '</td>'
    )

} );
