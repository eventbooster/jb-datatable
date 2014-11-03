The angular datatable directive for fluffy back offices.

#Installation

Download manually or through bower:

```bash
$ bower install jb-datatable 
```

Plugin requires eb-api-wrapper and, of course, angular.

#Usage (Short version)

1. Load ```jb.datatable``` in your angular module definition:

  ```javascript
  angular.module( "myModule", [ "jb.datatable" ] );
  ```
  
1. Set the necessary variables in your controller

  ```javascript
  // The only argument passed is the row's data fetched from server
  function renderEditCell( data ) {
    return "<button data-ng-click='$parent.editField(" + data.id + ")>Edit</button>";
  }
  
  $scope.endpoint   = "/test";
  
  // Defines the columns to be displayed in table
  //
  // Get neested fields by using dot syntax: tags.0.name returns row["tags"][0]["name"]
  // Asterisk prefix (*) makes the field searchable. Please note: The current fluffy version 
  // does only support **one** column to be searched.
  // TBD: Constraints
  $scope.fields     = [ "*name", "tags.0.name", "startDate", renderEditCell ];
 
  // Defines entries to be displayed in filter dropdown above table
  //
  // Returns an array, consisting of objects with two properties
  // name:   The filter's name
  // filter: Filter to be applied to data; maybe a function, has to return a filter string
  $scope.filterList   	= [ {
    "name"            : "All"
    , "filter"        : ""
  }, {
    "name"            : "Upcoming"
    "filter"          : function() {
      return "startDate>" + new Date().getTime()
    }
  }
  ```

1. Use the datatable in your HTML code:

  ```html
  <div data-datatable 
        endpoint="endpoint"
        labels="Name,Amount,Start,Edit"
        select="*"
        order="name"
        table-class="table"
        fields="fields"
        filter="filter"
        class="datatable" ></div>
  ```
  
Instead of taking the endpoint from the controller, you might use ```endpoint="'/endpoint'"```.

#Usage (Long version)

## Update table's data
```javascript
$rootScope.$broadcast( 'reloadDatatableData' );
```