// DOM Ready
$(function () {
  "use strict";

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

  // Initialize the grid
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

  // Override gridster methods so the axes are updated to properly reflect
  // the number of rows and columns currently in use.
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


  // Extend CSSGRIDGENERATOR to use jQuery
  var commonPopoverOptions = {
    animation: "fade",
    closeable: true,
    cache: "false",
    trigger: "manual",
    backdrop: true,
  };
  var popoverFormPrefix = 'editCol-';
  var popoverFormIdBase = 'editForm-';


  /**
   * Attach a popover for editing a cell to the given selector.
   * @method
   * @param {string} selector - jQuery selector specifying what to attach the popover to
   */
  CSSGRIDGENERATOR.grid.attachEditCellPopover = function (selector) {
    console.log(selector);
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
  };


  /**
   * Attach a popover for editing a column to the given selector.
   * @method
   * @param {string} selector - jQuery selector specifying what to attach the popover to
   */
  CSSGRIDGENERATOR.grid.attachEditColPopover = function (selector) {
    $(selector).webuiPopover($.extend({
      title: "Edit Column",
      content: function () {
        var colId = $(this).parent().data('col');

        // Build form
        var form = new BootstrapForm(popoverFormIdBase + "Column-" + colId, {
          submitText: 'Save'
        });
        form.addInput(popoverFormPrefix + "gridTemplateColumn-" + colId, 'text', {
          label: "Width",
          info: "Valid values: \<length\>, \<percentage\>, \<flex\>, max-content, min-content, minmax(min, max), and auto as defined by the W3 CSS Grid Specification.",
          helpLink: {
            url: 'http://www.w3.org/TR/css-grid-1/#track-sizing',
            title: 'Open W3 Specification',
          },
        });
        form.addInput(popoverFormPrefix + "gridColumnGap", 'text', {
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
  };


  /**
   * Attach a popover for editing a row to the given selector.
   * @method
   * @param {string} selector - jQuery selector specifying what to attach the popover to
   */
  CSSGRIDGENERATOR.grid.attachEditRowPopover = function (selector) {
    $(selector).webuiPopover($.extend({
      title: "Edit Row",
      content: function () {
        var rowId = $(this).parent().data('row');

        // Build form
        var form = new BootstrapForm(popoverFormIdBase + "Row-" + rowId, {
          submitText: 'Save'
        });
        form.addInput(popoverFormPrefix + "gridTemplateRow-" + rowId, 'text', {
          label: "Width",
          info: "Valid values: \<length\>, \<percentage\>, \<flex\>, max-content, min-content, minmax(min, max), and auto as defined by the W3 CSS Grid Specification.",
          helpLink: {
            url: 'http://www.w3.org/TR/css-grid-1/#track-sizing',
            title: 'Open W3 Specification',
          },
        });
        form.addInput(popoverFormPrefix + "gridRowGap", 'text', {
          label: "Gap",
          help: "The vertical space between rows. This is the same for all rows.",
          info: "Valid value: \<length\> as defined by the W3 CSS Grid Specification.",
          helpLink: {
            url: 'http://www.w3.org/TR/css-grid-1/#gutters',
            title: 'Open W3 Specification',
          },
        });
        return form.form();
      },
    }, commonPopoverOptions));
  };

  $("#index-col li .edit").each(function (index, el) {
    CSSGRIDGENERATOR.grid.attachEditColPopover(el);
  });
  $("#index-row li .edit").each(function (index, el) {
    CSSGRIDGENERATOR.grid.attachEditRowPopover(el);
  });
  $("#grid li .edit").each(function (index, el) {
    CSSGRIDGENERATOR.grid.attachEditCellPopover(el);
  });


  // Add cell to the grid
  $("#addCell").click(function () {
    var newCell = CSSGRIDGENERATOR.grid.addCell();

    // Attach handlers to new cell
    var $newCell = $(newCell);
    var sNewCell = 'li[data-row="' + $newCell.data('row') + '"][data-col="' + $newCell.data('col') + '"] .edit';
    console.log(sNewCell);
    CSSGRIDGENERATOR.grid.attachEditCellPopover(sNewCell);
  });


  // Add column to the grid
  //$(sAddCol).click(function () {
  //});


  // Add row to the grid
  //$(sAddRow).click(function () {
  //});


  /**
   * Invoke attached edit cell popover for given selector.
   * @method
   * @param {string} selector - jQuery selector specifying what to attach the popover to
   */
  CSSGRIDGENERATOR.grid.editCell = function (selector) {
    console.log(selector);
    console.log($(selector));
    var editObj = $(selector);
    editObj.webuiPopover('show');

    var cellId = $(selector).parent().data('row') + '-' + $(selector).parent().data('col');
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
    console.log("#" + popoverFormIdBase + 'Cell-' + cellId);
    $("#" + popoverFormIdBase + 'Cell-' + cellId).submit( function (e) {
      e.preventDefault();
    }).validate(validateOptions);
  };


  // ref: http://www.shamasis.net/2009/07/regular-expression-to-validate-css-length-and-position-values/
  var rValidGap = /^\s*(auto|0)$|^[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)$\s*/;
  // Valid regex for gridTemplateRows and/or gridTemplateColumns fields
  // ref: http://www.w3.org/TR/css-grid-1/#propdef-grid-template-columns
  var rValidGridTemplate = /^\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr|minmax\(\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*,\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*\))\s*$/;

  /**
   * Invoke attached edit column popover for given selector.
   * @method
   * @param {string} selector - jQuery selector specifying what to attach the popover to
   */
  CSSGRIDGENERATOR.grid.editCol = function (selector) {
    var editObj = $(selector);
    editObj.webuiPopover("show");

    var id = $(selector).parent().data("col");
    $('[data-toggle="tooltip"]').tooltip();

    // Set values
    CSSGRIDGENERATOR.grid.updateDimensions();
    $("#" + popoverFormIdBase + "Column-" + id + " input").each(function () {
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
    validateOptions.rules[popoverFormPrefix+"gridTemplateColumn-"+id] = { pattern: rValidGridTemplate };
    validateOptions.rules[popoverFormPrefix+"gridColumnGap"] = { pattern: rValidGap };

    $('.webui-popover-backdrop').off('click').on('click', function () {
      editObj.webuiPopover('hide');
    });

    // Handle submission
    $("#" + popoverFormIdBase + "Column-" + id).submit( function (e) {
      e.preventDefault();
    }).validate(validateOptions);
  };


  /**
   * Invoke attached edit row popover for given selector.
   * @method
   * @param {string} selector - jQuery selector specifying what to attach the popover to
   */
  CSSGRIDGENERATOR.grid.editRow = function (selector) {
    var editObj = $(selector);
    editObj.webuiPopover("show");

    var id = $(selector).parent().data("row");
    $('[data-toggle="tooltip"]').tooltip();

    // Set values
    CSSGRIDGENERATOR.grid.updateDimensions();
    $("#" + popoverFormIdBase + "Row-" + id + " input").each(function () {
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
    validateOptions.rules[popoverFormPrefix+"gridTemplateRow-"+id] = { pattern: rValidGridTemplate };
    validateOptions.rules[popoverFormPrefix+"gridRowGap"] = { pattern: rValidGap };

    $('.webui-popover-backdrop').off('click').on('click', function () {
      editObj.webuiPopover('hide');
    });

    // Handle submission
    $("#" + popoverFormIdBase + "Row-" + id).submit( function (e) {
      e.preventDefault();
    }).validate(validateOptions);
  };


  //=========================================================================



  $("#grid").on('click', 'button[data-toggle="popover"].edit', function () {
    CSSGRIDGENERATOR.grid.editCell(this);
  });


  $("#index-row").on('click', 'button[data-toggle="popover"].edit', function () {
    CSSGRIDGENERATOR.grid.editRow(this);
  });


  $("#index-col").on('click', 'button[data-toggle="popover"].edit', function () {
    CSSGRIDGENERATOR.grid.editCol(this);
  });


  // Export grid as CSS
  $("#export").click(function () {
    //$("#exportResult").html(CSSGRIDGENERATOR.grid.exportCSS());
    $("#exportModal .modal-body").html(CSSGRIDGENERATOR.grid.exportCSS());
    $("#exportModal").modal('show');
  });
});
