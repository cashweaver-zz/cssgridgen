"use strict";
var CSSGRIDGENERATOR = CSSGRIDGENERATOR || {};

/**
 * TODO
 */
CSSGRIDGENERATOR.grid = {
  grid: {}, // Set later
  gridTemplateRows: ['auto'],
  gridTemplateColumns: ['auto'],
  gridColumnGap: "0",
  gridRowGap: "0",
  newCellTemplate: '<li data-name=""><button type="button" data-toggle="popover" class="btn btn-default edit edit-cell"><span class="fa fa-lg fa-pencil"></span> <span class="sr-only">Edit</span></button><span class=""name""></span></li>',
  cols: 1,
  rows: 1,

  /**
   * Update our record of the grid's dimensions
   * @method
   */
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


  /**
   * Add an element to the grid
   * @method
   * @returns TODO
   */
  addCell: function () {
    return this.grid.add_widget(this.newCellTemplate, 1, 1);
  },


  /**
   * Edit a cell. This method is left unwritten to be handled by the implementer.
   * @method
   */
  editCell: function () {
    throw new Error("editCell must be overridden before use");
  },


  /**
   * Edit a row. This method is left unwritten to be handled by the implementer.
   * @method
   */
  editRow: function () {
    throw new Error("editRow must be overridden before use");
  },


  /**
   * Edit a column. This method is left unwritten to be handled by the implementer.
   * @method
   */
  editCol: function () {
    throw new Error("editCol must be overridden before use");
  },


  /**
   * Export a CSS representation of the current state of the grid
   * @method
   * @returns {string} a CSS representation of the current state of the grid
   */
  exportCSS: function () {
    // Build a CSS rule set
    function buildCSSRule(obj, options) {
      var o = options || {};
      var tab = ("tab" in o && typeof o.tab === "string") ? o.tab : "  ";
      var newLine = ("newLine" in o && typeof o.newLine === "string") ? o.newLine : "\n";

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
          css += "\n";

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
            'grid-template-columns': this.gridTemplateColumns.join(' '),
            'grid-template-rows': this.gridTemplateRows.join(' '),
            'grid-gap': this.gridColumnGap + " " + this.gridRowGap,
          }
        }) + "\n" + css;
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
          css += "\n";
        });

        css = buildCSSRule({
          'selector': "#grid",
          'properties': {
            'display': "grid",
            'grid-template-columns': this.gridTemplateColumns.join(' '),
            'grid-template-rows': this.gridTemplateRows.join(' '),
            'grid-gap': this.gridColumnGap + " " + this.gridRowGap,
          }
        }) + "\n" + css;
        break;
      default:
        break;
    }

    return css;
  }
};
