String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

$(function(){ //DOM Ready

  $(".gridster ul").gridster({
    widget_margins: [10, 10],
    widget_base_dimensions: [140, 140],
    serialize_params: function($w, wgd) {
      var result = {
        col: wgd.col,
        row: wgd.row,
        size_x: wgd.size_x,
        size_y: wgd.size_y,
        name: wgd.el.data('name')
      };
      return result;
    },
    resize: {
      enabled: true
    }
  });
  var gridster = $(".gridster ul").gridster().data('gridster');

  // Add Cell
  $("#addCell").click(function () {
    var newCell = {
      html:
        "<li data-name=''>" +
          "<button class='st-trigger-effect edit' data-effect='st-effect-3-right'>Edit</button>" +
          "<button class='delete'>Delete</button>" +
        "</li>",
      size_x: 1,
      size_y: 1,
      //col: 1,
      //row: 1
    }
    var cellHtml =
    gridster.add_widget(newCell.html, newCell.size_x, newCell.size_y);
  });

  $("#serializeGrid").click(function () {
    console.log(gridster.serialize());
  });

  $("#toggleDeleteMode").click(function () {
    $(".gridster").toggleClass("deleteModeEnabled");
    $(".gridster ul li .delete").click(function () {
      gridster.remove_widget($(this).parent());
    })
  });

  // Edit
  var editCellPrefix = 'editCell-'
  $(".gridster ul li .edit").click(function () {
    var cell = $(this).parent();
    var data = cell.data();

    // Build form
    var formHtml = "<h2>Edit Cell</h2><form id='editCellForm' name='editCellForm'>";
    for (var property in data) {
      if (data.hasOwnProperty(property)) {
        // Don't convert every property into an input
        if ($.inArray(property, ['coords', 'row', 'col', 'sizex', 'sizey']) == -1) {
        formHtml +=
          "<div class='form-group'>" +
            "<label for='" + editCellPrefix + property +"'>" + property.toProperCase() + "</label>" +
            "<input type='text' class='form-control' id='" + editCellPrefix + property + "'name='" + editCellPrefix + property + "'>" +
          "</div>";
        }
      }
    }
    formHtml += "<button type='submit' class='btn btn-default'>Save</button></form>";
    $("#editCellMenu").html(formHtml);

    // Set values
    $("#editCellForm input").each(function () {
      $(this).val(cell.data($(this)[0].id.replace(editCellPrefix, '')));
    });

    // Handle submission
    $("#editCellForm").off('submit').on('submit', function () {
      var dataArray = $(this).serializeArray();
      for (i = 0; i < dataArray.length; i++) {
        // TODO: Sanatize?
        cell.data(dataArray[i].name.replace(editCellPrefix, ''), dataArray[i].value);
      }
      return false;
    });
  });

  // Build a CSS rule set
  function buildCSS(obj, tab, newLine) {
    tab = (typeof tab !== 'undefined') ? tab : "  ";
    newLine = (typeof newLine !== 'undefined') ? newLine : "<br>";

    var css = "";
    if (!obj.hasOwnProperty('selector') || !obj.hasOwnProperty('properties')) {
      css = undefined;
    }
    else {
      css = obj.selector + " {" + newLine;
      for (var prop in obj.properties) {
        css += tab + prop + ": " + obj.properties[prop] + ";" + newLine;
      }
      css += "}" + newLine;
    }
    return css;
  }

  // Determine which method to use to build the CSS which defines the current state of the grid
  function getCellIndexMethod() {
    var validAreas = true;
    gridster.serialize().forEach(function (cell, index) {
      if (!cell.hasOwnProperty('name') || typeof cell.name != "string" || (!cell.name || cell.name.length === 0)) {
        validAreas = false;
      }
    });

    return (validAreas) ? "areas" : "coords";
  }

  // Called for each cell to determine the grid's dimensions
  function updateGridDimensions(gd, cell) {
    gd.x = ((cell.col + cell.size_x - 1) > gd.x) ? (cell.col + cell.size_x - 1) : gd.x;
    gd.y = ((cell.row + cell.size_y - 1) > gd.y) ? (cell.row + cell.size_y - 1) : gd.y;
  }

  // Export CSS which defines the current state of the grid
  $("#export").click(function () {
    var numCols = 0, numRows = 0;
    var gridDimensions = {
      'x': 0,
      'y': 0
    }
    var cellIndexMethod = getCellIndexMethod();
    var css = "";

    switch (cellIndexMethod) {
      case "areas":
        var areas = [];
        gridster.serialize().forEach(function (cell, index) {
          css += buildCSS({
            'selector': "#area-" + (index + 1),
            'properties': {
              'grid-area': cell.name
            }
          });

          var gridColStart = cell.col,
            gridColEnd = cell.col + cell.size_x,
            gridRowStart = cell.row,
            gridRowEnd = cell.row + cell.size_y;
          for (var y = gridRowStart - 1; y < gridRowEnd - 1; y++) {
            for (var x = gridColStart - 1; x < gridColEnd - 1; x++) {
              if (typeof areas[y] === 'undefined') {
                areas[y] = [];
              }
              areas[y][x] = cell.name
            }
          }

          updateGridDimensions(gridDimensions, cell);
        });

        var gridTemplateColumns = "auto",
          gridTemplateRows = "auto";

        for (i = 1; i < gridDimensions.x; i++) {
           gridTemplateColumns += " auto";
        }
        for (i = 1; i < gridDimensions.y; i++) {
           gridTemplateRows += " auto";
        }

        var gridTemplateAreas = "";
        for (var row in areas) {
          gridTemplateAreas += "\"" + areas[row].join(" ") + "\" ";
        }

        var gridTemplateAreas = "";
        for (y = 0; y < gridDimensions.y; y++) {
          gridTemplateAreas += (y > 0) ? " \"" : "\"";
          for (x = 0; x < gridDimensions.x; x++) {
            gridTemplateAreas += (x > 0) ? " " : "";
            gridTemplateAreas += (typeof areas[y][x] !== 'undefined') ? areas[y][x] : '.';
          }
          gridTemplateAreas += "\"";
        }

        css = buildCSS({
          'selector': "#grid",
          'properties': {
            'display': "grid",
            'grid-template-areas': gridTemplateAreas,
            'grid-template-columns': gridTemplateColumns,
            'grid-template-rows': gridTemplateRows,
          }
        }) + css;
        break;
      case "coords":
        gridster.serialize().forEach(function (cell, index) {
          css += buildCSS({
            'selector': "#area-" + (index + 1),
            'properties': {
              'grid-column-start': cell.col,
              'grid-column-end': cell.col + cell.size_x,
              'grid-row-start': cell.row,
              'grid-row-end': cell.row + cell.size_y,
            }
          });
          updateGridDimensions(gridDimensions, cell);
        });

        var gridTemplateColumns = "auto",
          gridTemplateRows = "auto";

        for (i = 1; i < gridDimensions.x; i++) {
           gridTemplateColumns += " auto";
        }
        for (i = 1; i < gridDimensions.y; i++) {
           gridTemplateRows += " auto";
        }

        css = buildCSS({
          'selector': "#grid",
          'properties': {
            'display': "grid",
            'grid-template-columns': gridTemplateColumns,
            'grid-template-rows': gridTemplateRows,
          }
        }) + css;
        break;
      default:
        break;
    }

    $("#exportResult").html(css);
  });
});
