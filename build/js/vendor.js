"use strict";

/**
 * Represents an HTML form in the style of Twitter Bootstrap
 * @constructor
 * @param {string} id - The form's id.
 * @param {object} options - Optional configuration.
 */
var BootstrapForm = function (id, options) {
  this.options = options || {};
  this.body = "";
  try {
    if (typeof id !== "string" || id.length == 0) {
      throw new Error("Invalid Argument: id must a non-empty string");
    }
    else {
    this.id = id;
    }
  }
  catch (e) {
    console.log("Error: " + e.message);
  }
};

/**
 * Returns HTML form
 * @returns {string} The HTML form
 */
BootstrapForm.prototype.form = function () {
  return '<form ' +
    'id="' + this.id + '"' +
    'name="' + this.id + '"' +
    'class="' + (this.options.classes || "") + '"' +
    '>' +
    this.body +
    '<button type="submit" class="btn btn-success">' + (this.options.submitText || "Submit") + '</button>' +
    '</form>';
}

/**
 * Append input to the form body
 * @param {string} id - The input's id.
 * @param {string} type - The input's type.
 * @param {object} options - Optional configuration.
 */
BootstrapForm.prototype.addInput = function (id, type, options) {
  var o = options || {};

  // TODO: Improve naive type checking
  this.body += '<div class="form-group">';
  this.body += '<label for="' + id + '">' + (o.label || "");
  if (o.info) {
    this.body += ' <a href="#" data-toggle="tooltip" data-placement="right" title="' + o.info + '"><i class="fa fa-info-circle"></i></a>';
  }
  if (o.helpLink && o.helpLink.url) {
    this.body += ' <a href="' + o.helpLink.url + '" target="_blank" data-toggle="tooltip" data-placement="right" title="' + (o.helpLink.title || "") + '"><i class="fa fa-question-circle"></i></a>';
  }
  this.body += '</label>';
  this.body += '<input id="' + id + '" name="' + id + '" type="' + type + '"';
  this.body += ' class="form-control ' + (o.classes || "") + '"';
  if (o.placeholder) {
    this.body += ' placeholder="' + o.placeholder + '"';
  }
  this.body += '>';
  if (o.help) {
    this.body += '<p class="help-block">' + o.help + '</p>';
  }
  this.body += '</div>';
}

// DOM Ready
$(function () {
  "use strict";

  var commonPopoverOptions = {
    animation: "fade",
    closeable: true,
    cache: "false",
    trigger: "manual",
    backdrop: true,
  }
  var popoverFormPrefix = 'editCol-';
  var popoverFormIdBase = 'editForm-';

  function initEditCellPopover(selector) {
    $(selector).webuiPopover($.extend({
      title: 'Edit Cell',
      content: function () {
        var cell = $(this).parent().data('row') + '-' + $(this).parent().data('col');

        // Build form
        var form = new BootstrapForm(popoverFormIdBase + 'Cell-' + cell, {
          submitText: 'Save'
        });
        form.addInput(popoverFormPrefix+'name', 'text', {
          label: "Name",
          info: "Valid value: \<custom-ident\> as defined by the W3 CSS Grid Specification.",
          helpLink: {
            url: 'http://www.w3.org/TR/css-grid-1/#track-sizing',
            title: 'Open W3 Specification',
          },
        });

        return form.form() + '<button id="deleteCell-' + cell + '" class="btn btn-danger">Delete</button>';
      }
    }, commonPopoverOptions));
    $(selector).off('click').on('click', function () {
      var editObj = $(this);
      editObj.webuiPopover('show');

      var cellId = $(this).parent().data('row') + '-' + $(this).parent().data('col');
      $('[data-toggle="tooltip"]').tooltip();

      // Set values
      CSSGRIDGENERATOR.grid.updateDimensions();
      $("#" + popoverFormIdBase + "Cell-" + cellId + " input").val(editObj.parent().data('name'));

      var validateOptions = {
        rules: {},
        submitHandler: function (form, event) {
          var formData = $(form).serializeArray();
          for (var i = 0; i < formData.length; i++) {
            var fieldName = formData[i].name.replace(popoverFormPrefix, '');
            editObj.parent().data(fieldName, formData[i].value.trim());
          }
          // Update user-facing values
          editObj.parent().children('.name').html(editObj.parent().data('name'));

          $("#alerts").html('<div class="alert alert-success alert-dismissible fade in" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Success!</strong> The grid has been updated successfully.</div>');
          editObj.webuiPopover('hide');
        },
      };
      var rValidNameArea = /^\s*[0-9a-zA-Z-_]+\s*$/;
      validateOptions.rules[popoverFormPrefix+"name"] = { pattern: rValidNameArea };

      $('.webui-popover-backdrop').off('click').on('click', function () {
        editObj.webuiPopover('hide');
      });

      $("#deleteCell-" + cellId).click(function () {
        editObj.webuiPopover('destroy');
        CSSGRIDGENERATOR.grid.grid.remove_widget(editObj.parent(), function () {
          // TODO: Undo delete
        });
      });

      // Handle submission
      //$("#" + popoverFormIdBase + 'Cell-' + cellId).off('submit').on('submit', function (e) {
      $("#" + popoverFormIdBase + 'Cell-' + cellId).submit( function (e) {
        e.preventDefault();
      }).validate(validateOptions);
    });
  }

  function initEditColumnAndRowPopovers() {
    // ref: http://www.shamasis.net/2009/07/regular-expression-to-validate-css-length-and-position-values/
    var rValidGap = /^\s*(auto|0)$|^[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)$\s*/;
    // Valid regex for gridTemplateRows and/or gridTemplateColumns fields
    // ref: http://www.w3.org/TR/css-grid-1/#propdef-grid-template-columns
    var rValidGridTemplate = /^\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr|minmax\(\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*,\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*\))\s*$/;

    var axes = [
      { machine: "col", human: "Column" },
      { machine: "row", human: "Row" }
    ];

    axes.forEach(function (axis) {
      $('[data-toggle="popover"].edit.edit-' + axis.machine).webuiPopover($.extend({
        title: "Edit " + axis.human,
        content: function () {
          var colId = $(this).parent().data(axis.machine);

          // Build form
          var form = new BootstrapForm(popoverFormIdBase + axis.human + "-" + colId, {
            submitText: 'Save'
          });
          form.addInput(popoverFormPrefix + "gridTemplate" + axis.human + "-" + colId, 'text', {
            label: "Width",
            info: "Valid values: \<length\>, \<percentage\>, \<flex\>, max-content, min-content, minmax(min, max), and auto as defined by the W3 CSS Grid Specification.",
            helpLink: {
              url: 'http://www.w3.org/TR/css-grid-1/#track-sizing',
              title: 'Open W3 Specification',
            },
          });
          form.addInput(popoverFormPrefix + "grid" + axis.human + "Gap", 'text', {
            label: "Gap",
            help: "The horizontal space between columns. This is the same for all columns.",
            info: "Valid value: \<length\> as defined by the W3 CSS Grid Specification.",
            helpLink: {
              url: 'http://www.w3.org/TR/css-grid-1/#gutters',
              title: 'Open W3 Specification',
            },
          });
          return form.form();
        },
      }, commonPopoverOptions));

      $('[data-toggle="popover"].edit.edit-' + axis.machine).off('click').on('click', function () {
        var editObj = $(this);
        editObj.webuiPopover('show');

        var id = $(this).parent().data(axis.machine);
        $('[data-toggle="tooltip"]').tooltip();

        // Set values
        CSSGRIDGENERATOR.grid.updateDimensions();
        $("#" + popoverFormIdBase + axis.human + "-" + id + " input").each(function () {
          var fieldName = $(this)[0].id.replace(popoverFormPrefix, '');
          if (fieldName.match(/Template/)) {
            var index = fieldName.match(/[0-9]+/);
            fieldName = fieldName.replace(/-[0-9]+/, '') + "s";
            $(this).val(CSSGRIDGENERATOR.grid[fieldName][index.pop()]);
          }
          else if (fieldName.match(/Gap/)) {
            $(this).val(CSSGRIDGENERATOR.grid[fieldName]);
          }
        });

        var validateOptions = {
          rules: {},
          submitHandler: function (form, event) {
            var formData = $(form).serializeArray();
            for (var i = 0; i < formData.length; i++) {
              var fieldName = formData[i].name.replace(popoverFormPrefix, '');
              if (fieldName.match(/Gap/)) {
                CSSGRIDGENERATOR.grid[fieldName] = formData[i].value;
              }
              else if (fieldName.match(/Template/)) {
                var index = fieldName.match(/[0-9]+/);
                fieldName = fieldName.replace(/-[0-9]+/, '');
                fieldName = fieldName.replace(/-[0-9]+/, '') + "s";
                CSSGRIDGENERATOR.grid[fieldName][index.pop()] = formData[i].value;
              }
            }
            $("#alerts").html('<div class="alert alert-success alert-dismissible fade in" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Success!</strong> The grid has been updated successfully.</div>');
            editObj.webuiPopover('hide');
          },
        };
        validateOptions.rules[popoverFormPrefix+"gridTemplate" + axis.human +"-"+id] = { pattern: rValidGridTemplate };
        validateOptions.rules[popoverFormPrefix+"grid" + axis.human + "Gap"] = { pattern: rValidGap };

        $('.webui-popover-backdrop').off('click').on('click', function () {
          editObj.webuiPopover('hide');
        });

        // Handle submission
        $("#" + popoverFormIdBase + axis.human + "-" + id).submit( function (e) {
          e.preventDefault();
        }).validate(validateOptions);
      });
    });
  }
  initEditColumnAndRowPopovers();
  initEditCellPopover('[data-toggle="popover"].edit.edit-cell');


  // The grid is made of 12 cells and 24 gutters
  var scrollbar_width = 17;
  var index_row_padding = 10;
  var viewport = $('body').innerWidth() - scrollbar_width - index_row_padding;
  var gutter_width = 15;
  var num_cells = 12;
  viewport -= gutter_width * 24;
  var cell_width = Math.floor(viewport / num_cells);

  // Inject styles for indexes (column and row)
  var index_col_style =
    '<style type="text/css">' +
      '.index.index-col li {' +
        'width: ' + cell_width + 'px;' +
        'margin-left: ' + gutter_width + 'px;' +
        'margin-right: ' + gutter_width + 'px;' +
      '}' +
      '.index.index-row li {' +
        'height: ' + (cell_width + gutter_width * 2) + 'px;' +
        'line-height: ' + cell_width + 'px;' + // Vertical center
        'padding-top: ' + gutter_width + 'px;' +
        'padding-left: ' + index_row_padding + 'px;' +
        'padding-bottom: ' + gutter_width + 'px;' +
      '}' +
    '</style>';
  $('head').append(index_col_style);


  $('#grid').gridster({
    widget_margins: [gutter_width, gutter_width],
    widget_base_dimensions: [cell_width, cell_width],
    serialize_params: function($w, wgd) {
      var result = {
        col: wgd.col,
        row: wgd.row,
        extra_cols: 0,
        size_x: wgd.size_x,
        size_y: wgd.size_y,
      // Add support for name
        name: wgd.el.data('name')
      };
      return result;
    },
    resize: {
    enabled: true
    }
  });

  CSSGRIDGENERATOR.grid.grid = $('#grid').gridster().data('gridster');
  // Override set_dom_grid_* and add index resizing code.
  CSSGRIDGENERATOR.grid.grid.set_dom_grid_width = function (cols) {
    Gridster.prototype.set_dom_grid_width.call(this, cols);

    if (typeof cols === 'undefined') {
      cols = this.get_highest_occupied_cell().col;
    }
    var max_cols = (this.options.autogrow_cols ? this.options.max_cols : this.cols);
    cols = Math.min(max_cols, Math.max(cols, this.options.min_cols));

    $('#index-col li').each(function (index) {
      $(this).css('display', (index < cols) ? 'block' : 'none');
    });

    return this;
  };
  CSSGRIDGENERATOR.grid.grid.set_dom_grid_height = function (height) {
    Gridster.prototype.set_dom_grid_height.call(this, height);

    if (typeof height === 'undefined') {
      var r = this.get_highest_occupied_cell().row;
      height = r * this.min_widget_height;
    }
    var cell_height_with_gutters = cell_width + (gutter_width * 2);
    var num_rows = height / cell_height_with_gutters;

    $('#index-row li').each(function (index) {
      $(this).css('display', (index < num_rows) ? 'block' : 'none');
    });

    return this;
  };

  $("#export").click(function () {
    CSSGRIDGENERATOR.grid.exportCSS();
  });

  $("#addCell").click(function () {
    var newCell = CSSGRIDGENERATOR.grid.addElement();
    var newCellSelector = 'li[data-row="' + $(newCell).data('row') + '"][data-col="' + $(newCell).data('col') + '"] .edit.edit-cell[data-toggle="popover"]';
    console.log(newCellSelector);
    console.log($(newCellSelector));

    // Apply callbacks to new elements
    initEditCellPopover(newCellSelector);
  });

  $("#editGrid").click(function () {
    CSSGRIDGENERATOR.grid.edit();
  });
});

String.prototype.toProperCase = function () {
  return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

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
