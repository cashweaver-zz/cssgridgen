var CSSGRIDGENERATOR = CSSGRIDGENERATOR || {};

CSSGRIDGENERATOR.grid = {
  grid: {}, // Set later
  gridTemplateRows: ['auto'],
  gridTemplateColumns: ['auto'],
  gridColumnGap: "0",
  gridRowGap: "0",
  cols: 1,
  rows: 1,

  updateDimensions: function () {
    var grid = this;
    // Update this.row, this.col
    this.cols = 0;
    this.rows = 0;
    this.grid.serialize().forEach(function (cell, index) {
      grid.cols = Math.max((cell.col + cell.size_x - 1), grid.cols);
      grid.rows = Math.max((cell.row + cell.size_y - 1), grid.rows);
    });

    // Match template arrays to the current grid state
    // Add new cols/rows
    for (var x = 0; x < this.cols; x++) {
      if (typeof this.gridTemplateColumns[x] === 'undefined') {
        this.gridTemplateColumns[x] = 'auto';
      }
    }
    for (var y = 0; y < this.rows; y++) {
      if (typeof this.gridTemplateRows[y] === 'undefined') {
        this.gridTemplateRows[y] = 'auto';
      }
    }

    // Delete removed cols/rows
    this.gridTemplateColumns = this.gridTemplateColumns.slice(0, this.cols);
    this.gridTemplateRows = this.gridTemplateRows.slice(0, this.rows);
  },

  // Edit the row heights, col widths, and gutters
  edit: function () {
    var prefix = 'editGrid-';
    var formId = 'editGridForm';
    var grid = this;

    // Build form
    var form = new BootstrapForm(formId);
    form.addInput(prefix+"gridColumnGap", 'text', {label: "Column Gap"});
    form.addInput(prefix+"gridRowGap", 'text', {label: "Row Gap"});
    this.updateDimensions();
    for (var x = 0; x < this.cols; x++) {
      form.addInput(prefix+"gridTemplateColumns-"+x, 'text', {label: "Column: " + (x+1)});
    }
    for (var y = 0; y < this.rows; y++) {
      form.addInput(prefix+"gridTemplateRows-"+y, 'text', {label: "Row: " + (y+1)});
    }
    var sidebarHtml = '<h2>Edit Grid</h2>' + form.form();
    $("#sidebar").html(sidebarHtml);

    // Set values
    $("#" + formId + " input").each(function () {
      var fieldName = $(this)[0].id.replace(prefix, '');
      if (fieldName.match(/Template/)) {
        var index = fieldName.match(/[0-9]+/);
        fieldName = fieldName.replace(/-[0-9]+/, '');
        $(this).val(grid[fieldName][index.pop()]);
      }
      else {
        $(this).val(grid[fieldName]);
      }
    });

    // Build validation
    // ref: http://www.shamasis.net/2009/07/regular-expression-to-validate-css-length-and-position-values/
    var gapValidRegex = /^\s*(auto|0)$|^[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)$\s*/;
    // Valid regex for gridTemplateRows and/or gridTemplateColumns fields
    // ref: http://www.w3.org/TR/css-grid-1/#propdef-grid-template-columns
    // everything but minmax:  /^\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*$/;
    var gridTemplateValidRegex = /^\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr|minmax\(\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*,\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*\))\s*$/;
    var validateOptions = {
      rules: {},
      submitHandler: function (form, event) {
        var formData = $(form).serializeArray();
        for (i = 0; i < formData.length; i++) {
          var fieldName = formData[i].name.replace(prefix, '');
          if (fieldName.match(/Gap/)) {
            grid[fieldName] = formData[i].value;
          }
          else if (fieldName.match(/Template/)) {
            var index = fieldName.match(/[0-9]+/);
            fieldName = fieldName.replace(/-[0-9]+/, '');
            grid[fieldName][index.pop()] = formData[i].value;
          }
        }
        $("#st-container").removeClass('st-menu-open');
        $("#alerts").html('<div class="alert alert-success alert-dismissible fade in" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Success!</strong> The grid has been updated successfully.</div>');
        // Wait to hide the form until the sidebar has closed
        // ref: http://stackoverflow.com/a/3473259
        $("#sidebar").delay(500).queue(function () {
          $(this).html('');
          $(this).dequeue();
        }).delay(500).queue(function () {

        });
      },
    };
    validateOptions.rules[prefix+"gridColumnGap"] = { pattern: gapValidRegex };
    validateOptions.rules[prefix+"gridRowGap"] = { pattern: gapValidRegex };
    for (var x = 0; x < this.cols; x++) {
      validateOptions.rules[prefix+"gridTemplateColumns-"+x] = { pattern: gridTemplateValidRegex };
    }
    for (var y = 0; y < this.rows; y++) {
      validateOptions.rules[prefix+"gridTemplateRows-"+y] = { pattern: gridTemplateValidRegex };
    }


    // Handle submission
    $("#" + formId).off('submit').on('submit', function (e) {
      e.preventDefault();
    }).validate(validateOptions);

  },

  // Add an element to the grid
  addElement: function () {
    var newElement = {
      html:
        "<li data-name=''>" +
          '<button type="button" data-toggle="popover" class="btn btn-default edit edit-cell"><span class="fa fa-lg fa-pencil"></span> <span class="sr-only">Edit</span></button>' +
          "<span class='name'></span>" +
        "</li>",
      sizex: 1,
      sizey: 1
    }
    return this.grid.add_widget(newElement.html, newElement.sizex, newElement.sizey);
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

    var css = "";

    this.updateDimensions();
    switch (getCellIndexMethod(this.grid)) {
      case "areas":
        var areas = [];
        this.grid.serialize().forEach(function (cell, index) {
          var results = cell.name.match(/^[0-9]/)
          var safe_cell_name = (results) ? "\\3" + results.pop() + ' ' + cell.name.substr(1) : cell.name;
          css += buildCSSRule({
            'selector': '#' + safe_cell_name,
            'properties': {
              // Note: Not all valid area names are valid <custom-ident>s
              // see:  http://www.w3.org/TR/css-grid-1/#valdef-grid-template-areas-string
              'grid-area': safe_cell_name,
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
        });

        var gridTemplateColumns = this.gridTemplateColumns.join(' '),
          gridTemplateRows = this.gridTemplateRows.join(' ');

        var gridTemplateAreas = "";
        for (var row in areas) {
          gridTemplateAreas += "\"" + areas[row].join(" ") + "\" ";
        }

        var gridTemplateAreas = "";
        for (var y = 0; y < this.rows; y++) {
          gridTemplateAreas += (y > 0) ? " \"" : "\"";
          for (var x = 0; x < this.cols; x++) {
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
            'grid-gap': this.gridColumnGap + " " + this.gridRowGap,
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
        });

        var gridTemplateColumns = this.gridTemplateColumns.join(' ');
          gridTemplateRows = this.gridTemplateRows.join(' ');

        css = buildCSSRule({
          'selector': "#grid",
          'properties': {
            'display': "grid",
            'grid-template-columns': gridTemplateColumns,
            'grid-template-rows': gridTemplateRows,
            'grid-gap': this.gridColumnGap + " " + this.gridRowGap,
          }
        }) + css;
        break;
      default:
        break;
    }

    $("#exportResult").html(css);
  }
};
