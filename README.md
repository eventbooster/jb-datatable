The angular datatable directive for fluffy back offices.

#Installation

Download manually or through bower:

```bash
$ bower install jb-datatable 
```

Plugin requires eb-api-wrapper and, of course, angular.

#Usage

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
  
  // Get neested fields by using dot syntax: tags.0.name returns row["tags"][0]["name"]
  // TBD: Constraints
  $scope.fields     = [ "name", "tags.0.name", "startDate", renderEditCell ];
  
  // Returns object
  // key:   filter's name
  // value: filter to be applied
  $scope.filters    = {
      "Upcoming"      : function() {
          "startDate>" + new Date().getTime()
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