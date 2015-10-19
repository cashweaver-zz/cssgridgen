var CSSGRIDGENERATOR = CSSGRIDGENERATOR || {};

CSSGRIDGENERATOR.grid = {
  grid: {}, // Set later
  gridTemplateRows: [],
  gridTemplateColumns: [],
  gridColumnGap: "",
  gridRowGap: "",

  // Edit the row heights, col widths, and gutters
  edit: function () {
    // Populate the sidebar with the edit form for this
    // Show the sidebar
  },

  // Add an element to the grid
  addElement: function () {
    var newElement = {
      html:
        "<li data-name=''>" +
          "<button class='st-trigger-effect edit' data-effect='st-effect-3-right'>Edit</button>" +
          "<button class='delete'>Delete</button>" +
        "</li>",
      sizex: 1,
      sizey: 1
    }
    gridster.add_widget(newElement.html, newElement.sizex, newElement.sizey);
  },

  // Delete an element from the grid
  deleteElement: function (el) {
    try {
      if (!(el instanceof jQuery)) {
        throw new Error("Invalid argument: Element is not a jQuery object");
      }
      gridster.remove_widget(el);
    }
    catch (e) {
      console.log("Failed to delete GridElement. \n" + e.message);
    }
  },

  // Export a usable CSS representation of the current state of the grid
  exportCSS: function () {
    // Build a CSS rule set
    function buildCSSRule(obj, tab, newLine) {
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

    function updateGridDimensions(gd, cell) {
      gd.x = ((cell.col + cell.size_x - 1) > gd.x) ? (cell.col + cell.size_x - 1) : gd.x;
      gd.y = ((cell.row + cell.size_y - 1) > gd.y) ? (cell.row + cell.size_y - 1) : gd.y;
    }

    // Determine which method to use to build the CSS which defines the current state of the grid
    function getCellIndexMethod(grid) {
      var validAreas = true;
      grid.serialize().forEach(function (cell, index) {
        if (!cell.hasOwnProperty('name') || typeof cell.name != "string" || (!cell.name || cell.name.length === 0)) {
          validAreas = false;
        }
      });
      return (validAreas) ? "areas" : "coords";
    }

    var gridDimensions = {
      'x': 0,
      'y': 0
    }
    var css = "";

    switch (getCellIndexMethod(this.grid)) {
      case "areas":
        var areas = [];
        this.grid.serialize().forEach(function (cell, index) {
          css += buildCSSRule({
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

        css = buildCSSRule({
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
        this.grid.serialize().forEach(function (cell, index) {
          css += buildCSSRule({
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

        css = buildCSSRule({
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
  }
};
