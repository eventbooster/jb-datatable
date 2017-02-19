The angular datatable directive for fluffy back offices. 

#Features

- Sort, pagination, search (only by one column for now)
- Set predefined filters (e.g. «All articles with a price > $100»)
- Auto-detects the fields for the select header (* plus all sub-entities through field.selector or field.select)

#Installation

Download manually or through bower:

```bash
$ bower install jb-datatable 
```

Plugin requires eb-api-wrapper and, of course, angular.

#Usage (Short version)

1. Load ```jb.datatable``` in your angular module definition:

  ```javascript
  angular.module( 'myModule', [ 'jb.datatable' ] );
  ```
  
1. Set the necessary variables in your controller

  ```javascript
  // Custom function to be rendered in a cell; will be referenced in $scope.fields
  // The only argument passed is the row's data fetched from server
  function renderEditCell( data ) {
    return '<button data-ng-click=\'$parent.editField(' + data.id + ')\'>Edit</button>';
  }
  
  // Endpoint to be fetched
  $scope.endpoint   = '/test';
  
  // Define the columns to be displayed in table
  //
  // TBD: Constraints
  $scope.fields     = [ {
        // Name of column to be displayed in table header
        title           : 'ID' 
        // Path that the row's data will be searched for
        , selector      : 'id' 
    }, {
        title           : 'First Tag'
        // A more complex path; returns row['tags'][0]['name']
        , selector      : 'tags.0.name'
        // Set searchable to true if column should be searchable
        , searchable    : true
        , fulltextEnabled : true
        , fulltextSelector : 'testSearch.document'
    }, {
        title           : 'Edit'
        // Pass a function; it's return value will be displayed in the
        // cell
        , content       : renderEditCell
    }, {
        title           : 'Description'
        // Truncate text
        , content       : function( data ) {
            return data.subentity.description.substring( 0, 100 ) + '…'
        }
        // Add subentity to the select statement as it's used in the
        // content function but may not be auto detected
        , select        : 'subentity.*'
    }
]
 
  // Defines entries to be displayed in filter dropdown above table
  //
  // Returns an array, consisting of objects with two properties
  // name:   The filter's name
  // filter: Filter to be applied to data; maybe a function, has to return a filter string
  $scope.filterList       = [ {
    'name'            : 'All'
    , 'filter'        : ''
  }, {
    'name'            : 'Upcoming'
    , 'filter'        : function() {
      return 'startDate>' + new Date().getTime()
    }
  }
  ```

1. Use the datatable in your HTML code:

  ```html
  <div data-datatable-with-filters>
      <div data-datatable 
            endpoint="endpoint"
            fields="fields"
            order="name" <!-- ASC by default -->
            filter="filter"></div>
    </div>
  ```
  
  If you prefer to use the datatable without the filter dropdown and the search field, leave out the enclosing `<div data-datatable-with-filters>`. The `searchable` property for the `$scope.filters`can be omitted.
  
  Instead of taking the endpoint from the controller, you might use ```endpoint="'/endpoint'"```.

#Usage (Long version)

## Update table's data
```javascript
$rootScope.$broadcast( 'reloadDatatableData' );
```