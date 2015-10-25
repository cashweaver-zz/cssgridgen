// DOM Ready
$(function () {
  SidebarMenuEffects();


  function initPopovers() {

    var prefix = 'editCol-';
    var formIdBase = 'editForm-';

    // Cells
    // Enable tooltips for editing
    $('[data-toggle="popover"].edit.edit-cell').webuiPopover({
      title: 'Edit Cell',
      animation: 'fade',
      closeable: true,
      cache: false,
      trigger: 'manual',
      backdrop: true,
      content: function () {
        var cell = $(this).parent().data('row') + '-' + $(this).parent().data('col');

        // Build form
        var form = new BootstrapForm(formIdBase + 'Cell-' + cell, {
          submitText: 'Save'
        });
        form.addInput(prefix+'name', 'text', 'Name', {
          info: "Valid value: \<custom-ident\> as defined by the W3 CSS Grid Specification.",
          help_link: {
            url: 'http://www.w3.org/TR/css-grid-1/#track-sizing',
            title: 'Open W3 Specification',
          },
        });
        //return form.form() + '<button id="deleteCell-' + cell + '" class="btn btn-danger"><i class="fa fa-trash-o fa-lg"></i> Delete</button>';
        return form.form() + '<button id="deleteCell-' + cell + '" class="btn btn-danger">Delete</button>';
      },
    });
    $('[data-toggle="popover"].edit.edit-cell').off('click').on('click', function () {
      editObj = $(this);
      editObj.webuiPopover('show');

      var cell = $(this).parent().data('row') + '-' + $(this).parent().data('col');
      $('[data-toggle="tooltip"]').tooltip();

      // Set values
      CSSGRIDGENERATOR.grid.updateDimensions();
      $("#" + formIdBase + 'Cell-' + cell + " input").each(function () {
        var fieldName = $(this)[0].id.replace(prefix, '');
        $(this).val(CSSGRIDGENERATOR.grid[fieldName]);
      });

      var validateOptions = {
        rules: {},
        submitHandler: function (form, event) {
          var formData = $(form).serializeArray();
          for (i = 0; i < formData.length; i++) {
            var fieldName = formData[i].name.replace(prefix, '');
            editObj.parent().data(fieldName, formData[i].value.trim());
          }
          // Update user-facing values
          editObj.parent().children('.name').html(editObj.parent().data('name'));

          $("#alerts").html('<div class="alert alert-success alert-dismissible fade in" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Success!</strong> The grid has been updated successfully.</div>');
          editObj.webuiPopover('hide');
        },
      };
      var areaNameValidRegex = /^\s*[0-9a-zA-Z-_]+\s*$/;
      validateOptions.rules[prefix+"name"] = { pattern: areaNameValidRegex };

      $('.webui-popover-backdrop').off('click').on('click', function () {
        editObj.webuiPopover('hide');
      });

      $("#deleteCell-" + cell).click(function () {
        editObj.webuiPopover('hide');
        CSSGRIDGENERATOR.grid.grid.remove_widget(editObj.parent(), function () {
          // TODO: Undo delete:w
        });
      });

      // Handle submission
      $("#" + formIdBase + 'Cell-' + cell).off('submit').on('submit', function (e) {
        e.preventDefault();
      }).validate(validateOptions);
    });



    // Columns
    // Enable tooltips for editing
    $('[data-toggle="popover"].edit.edit-col').webuiPopover({
      title: 'Edit Column',
      animation: 'fade',
      closeable: true,
      cache: false,
      trigger: 'manual',
      backdrop: true,
      content: function () {
        var col = $(this).parent().data('col');

        // Build form
        var form = new BootstrapForm(formIdBase + 'Col-' + col, {
          submitText: 'Save'
        });
        form.addInput(prefix+"gridTemplateColumns-"+col, 'text', 'Width', {
          info: "Valid values: \<length\>, \<percentage\>, \<flex\>, max-content, min-content, minmax(min, max), and auto as defined by the W3 CSS Grid Specification.",
          help_link: {
            url: 'http://www.w3.org/TR/css-grid-1/#track-sizing',
            title: 'Open W3 Specification',
          },
        });
        form.addInput(prefix+"gridColumnGap", 'text', 'Gap', {
          help: "The horizontal space between columns. This is the same for all columns.",
          info: "Valid value: \<length\> as defined by the W3 CSS Grid Specification.",
          help_link: {
            url: 'http://www.w3.org/TR/css-grid-1/#gutters',
            title: 'Open W3 Specification',
          },
        });
        return form.form();
      },
      //template: '<div class="webui-popover">' +
      //'<div class="arrow"></div>' +
      //'<div class="webui-popover-inner">' +
      //'<a href="#" class="close">x</a>' +
      //'<h3 class="webui-popover-title CUSTOM"></h3>' +
        //'<div class="webui-popover-content"><i class="icon-refresh"></i> <p>&nbsp;</p></div>' +
        //'</div>' +
        //'</div>',
    });
    //$('[data-toggle="popover"].edit.edit-col').click(function () {
    $('[data-toggle="popover"].edit.edit-col').off('click').on('click', function () {
      editObj = $(this);
      editObj.webuiPopover('show');

      var col = $(this).parent().data('col');
      $('[data-toggle="tooltip"]').tooltip();

      // Set values
      CSSGRIDGENERATOR.grid.updateDimensions();
      $("#" + formIdBase + 'Col-' + col + " input").each(function () {
        var fieldName = $(this)[0].id.replace(prefix, '');
        if (fieldName.match(/Template/)) {
          var index = fieldName.match(/[0-9]+/);
          fieldName = fieldName.replace(/-[0-9]+/, '');
          $(this).val(CSSGRIDGENERATOR.grid[fieldName][index.pop()]);
        }
        else if (fieldName.match(/Gap/)) {
          $(this).val(CSSGRIDGENERATOR.grid[fieldName]);
        }
      });

      // ref: http://www.shamasis.net/2009/07/regular-expression-to-validate-css-length-and-position-values/
      var gapValidRegex = /^\s*(auto|0)$|^[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)$\s*/;
      // Valid regex for gridTemplateRows and/or gridTemplateColumns fields
      // ref: http://www.w3.org/TR/css-grid-1/#propdef-grid-template-columns
      var gridTemplateValidRegex = /^\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr|minmax\(\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*,\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*\))\s*$/;
      var validateOptions = {
        rules: {},
        submitHandler: function (form, event) {
          var formData = $(form).serializeArray();
          for (i = 0; i < formData.length; i++) {
            var fieldName = formData[i].name.replace(prefix, '');
            if (fieldName.match(/Gap/)) {
              CSSGRIDGENERATOR.grid[fieldName] = formData[i].value;
            }
            else if (fieldName.match(/Template/)) {
              var index = fieldName.match(/[0-9]+/);
              fieldName = fieldName.replace(/-[0-9]+/, '');
              CSSGRIDGENERATOR.grid[fieldName][index.pop()] = formData[i].value;
            }
          }
          $("#alerts").html('<div class="alert alert-success alert-dismissible fade in" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Success!</strong> The grid has been updated successfully.</div>');
          editObj.webuiPopover('hide');
        },
      };
      validateOptions.rules[prefix+"gridTemplateColumns-"+col] = { pattern: gridTemplateValidRegex };
      validateOptions.rules[prefix+"gridColumnGap"] = { pattern: gapValidRegex };

      $('.webui-popover-backdrop').off('click').on('click', function () {
        editObj.webuiPopover('hide');
      });

      // Handle submission
      $("#" + formIdBase + 'Col-' + col).off('submit').on('submit', function (e) {
      //$("#" + formIdBase + 'Col-' + col).submit( function (e) {
        e.preventDefault();
      }).validate(validateOptions);
    });


    // Rows
    // Enable tooltips for editing
    $('[data-toggle="popover"].edit.edit-row').webuiPopover({
      title: 'Edit Row',
      placement: 'right',
      animation: 'fade',
      closeable: true,
      cache: false,
      trigger: 'manual',
      backdrop: true,
      content: function () {
        var row = $(this).parent().data('row');

        // Build form
        var form = new BootstrapForm(formIdBase + 'Row-' + row, {
          submitText: 'Save'
        });
        form.addInput(prefix+"gridTemplateRows-"+row, 'text', 'Height', {
          info: "Valid values: \<length\>, \<percentage\>, \<flex\>, max-content, min-content, minmax(min, max), and auto as defined by the W3 CSS Grid Specification.",
          help_link: {
            url: 'http://www.w3.org/TR/css-grid-1/#track-sizing',
            title: 'Open W3 Specification',
          },
        });
        form.addInput(prefix+"gridRowGap", 'text', 'Gap', {
          help: "The vertical space between rows. This is the same for all rows.",
          info: "Valid value: \<length\> as defined by the W3 CSS Grid Specification.",
          help_link: {
            url: 'http://www.w3.org/TR/css-grid-1/#gutters',
            title: 'Open W3 Specification',
          },
        });
        return form.form();
      },
      //template: '<div class="webui-popover">' +
        //'<div class="arrow"></div>' +
        //'<div class="webui-popover-inner">' +
        //'<a href="#" class="close">x</a>' +
        //'<h3 class="webui-popover-title CUSTOM"></h3>' +
        //'<div class="webui-popover-content"><i class="icon-refresh"></i> <p>&nbsp;</p></div>' +
        //'</div>' +
        //'</div>',
    });
    //$('[data-toggle="popover"].edit.edit-row').click(function () {
    $('[data-toggle="popover"].edit.edit-row').off('click').on('click', function () {
      editObj = $(this);
      editObj.webuiPopover('show');

      var row = $(this).parent().data('row');
      $('[data-toggle="tooltip"]').tooltip();

      // Set values
      CSSGRIDGENERATOR.grid.updateDimensions();
      $("#" + formIdBase + 'Row-' + row + " input").each(function () {
        var fieldName = $(this)[0].id.replace(prefix, '');
        if (fieldName.match(/Template/)) {
          var index = fieldName.match(/[0-9]+/);
          fieldName = fieldName.replace(/-[0-9]+/, '');
          $(this).val(CSSGRIDGENERATOR.grid[fieldName][index.pop()]);
        }
        else if (fieldName.match(/Gap/)) {
          $(this).val(CSSGRIDGENERATOR.grid[fieldName]);
        }
      });

      // ref: http://www.shamasis.net/2009/07/regular-expression-to-validate-css-length-and-position-values/
      var gapValidRegex = /^\s*(auto|0)$|^[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)$\s*/;
      // Valid regex for gridTemplateRows and/or gridTemplateColumns fields
      // ref: http://www.w3.org/TR/css-grid-1/#propdef-grid-template-columns
      var gridTemplateValidRegex = /^\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr|minmax\(\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*,\s*((auto|0)|[+-]?[0-9]+.?([0-9]+)?(px|em|ex|%|in|cm|mm|pt|pc)|max-content|min-content|[0-9]+fr)\s*\))\s*$/;
      var validateOptions = {
        rules: {},
        submitHandler: function (form, event) {
          var formData = $(form).serializeArray();
          for (i = 0; i < formData.length; i++) {
            var fieldName = formData[i].name.replace(prefix, '');
            if (fieldName.match(/Gap/)) {
              CSSGRIDGENERATOR.grid[fieldName] = formData[i].value;
            }
            else if (fieldName.match(/Template/)) {
              var fieldName = formData[i].name.replace(prefix, '');
              var index = fieldName.match(/[0-9]+/);
              fieldName = fieldName.replace(/-[0-9]+/, '');
              CSSGRIDGENERATOR.grid[fieldName][index.pop()] = formData[i].value;
            }
          }
          $("#alerts").html('<div class="alert alert-success alert-dismissible fade in" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Success!</strong> The grid has been updated successfully.</div>');
          editObj.webuiPopover('hide');
        },
      };
      validateOptions.rules[prefix+"gridTemplateRows-"+row] = { pattern: gridTemplateValidRegex };
      validateOptions.rules[prefix+"gridRowGap"] = { pattern: gapValidRegex };

      $('.webui-popover-backdrop').off('click').on('click', function () {
        editObj.webuiPopover('hide');
      });

      // Handle submission
      $("#" + formIdBase + 'Row-' + row).off('submit').on('submit', function (e) {
      //$("#" + formIdBase + 'Row-' + row).submit( function (e) {
        e.preventDefault();
      }).validate(validateOptions);
    });

  }
  initPopovers();


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

  // Handle editing and saving a grid element
  $('#grid .edit').click(function () {
    var gridEl = new GridElement($(this).parent());
    gridEl.edit();
  });

  $("#export").click(function () {
    CSSGRIDGENERATOR.grid.exportCSS();
  });

  $("#addCell").click(function () {
    var newCell = CSSGRIDGENERATOR.grid.addElement();
    var newCellSelector = 'li[data-row="' + $(newCell).data('row') + '"][data-col="' + $(newCell).data('col') + '"] .edit.edit-cell[data-toggle="popover"]';
    console.log(newCellSelector);
    console.log($(newCellSelector));

    // Apply callbacks to new elements
    var prefix = 'editCol-';
    var formIdBase = 'editForm-';

    // Cells
    // Enable tooltips for editing
    console.log('first thing');
    $(newCellSelector).webuiPopover({
      title: 'Edit Cell',
      animation: 'fade',
      closeable: true,
      cache: false,
      trigger: 'manual',
      backdrop: true,
      content: function () {
        var cell = $(this).parent().data('row') + '-' + $(this).parent().data('col');

        // Build form
        var form = new BootstrapForm(formIdBase + 'Cell-' + cell, {
          submitText: 'Save'
        });
        form.addInput(prefix+'name', 'text', 'Name', {
          info: "Valid value: \<custom-ident\> as defined by the W3 CSS Grid Specification.",
          help_link: {
            url: 'http://www.w3.org/TR/css-grid-1/#track-sizing',
            title: 'Open W3 Specification',
          },
        });
        //return form.form() + '<button id="deleteCell-' + cell + '" class="btn btn-danger"><i class="fa fa-trash-o fa-lg"></i> Delete</button>';
        return form.form() + '<button id="deleteCell-' + cell + '" class="btn btn-danger">Delete</button>';
      },
    });
    console.log('second thing');
    $(newCellSelector).off('click').on('click', function () {
      console.log('clicked');
      editObj = $(this);
      editObj.webuiPopover('show');

      var cell = $(this).parent().data('row') + '-' + $(this).parent().data('col');
      $('[data-toggle="tooltip"]').tooltip();

      // Set values
      CSSGRIDGENERATOR.grid.updateDimensions();
      $("#" + formIdBase + 'Cell-' + cell + " input").each(function () {
        var fieldName = $(this)[0].id.replace(prefix, '');
        $(this).val(CSSGRIDGENERATOR.grid[fieldName]);
      });

      var validateOptions = {
        rules: {},
        submitHandler: function (form, event) {
          var formData = $(form).serializeArray();
          for (i = 0; i < formData.length; i++) {
            var fieldName = formData[i].name.replace(prefix, '');
            editObj.parent().data(fieldName, formData[i].value.trim());
          }
          // Update user-facing values
          editObj.parent().children('.name').html(editObj.parent().data('name'));

          $("#alerts").html('<div class="alert alert-success alert-dismissible fade in" role="alert"> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Success!</strong> The grid has been updated successfully.</div>');
          editObj.webuiPopover('hide');
        },
      };
      var areaNameValidRegex = /^\s*[0-9a-zA-Z-_]+\s*$/;
      validateOptions.rules[prefix+"name"] = { pattern: areaNameValidRegex };

      $('.webui-popover-backdrop').off('click').on('click', function () {
        editObj.webuiPopover('hide');
      });

      console.log(cell);
      $("#deleteCell-" + cell).click(function () {
        editObj.webuiPopover('hide');
        CSSGRIDGENERATOR.grid.grid.remove_widget(editObj.parent(), function () {
          // TODO: Undo delete:w
        });
      });

      // Handle submission
      $("#" + formIdBase + 'Cell-' + cell).off('submit').on('submit', function (e) {
        e.preventDefault();
      }).validate(validateOptions);
    });
    console.log("end add");
  });

  $("#editGrid").click(function () {
    CSSGRIDGENERATOR.grid.edit();
  });
});
