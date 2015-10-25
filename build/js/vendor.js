var BootstrapForm = function (id, options) {
  options = options || {};
  if (options.classes && typeof options.classes === 'string') {
    this.formTag = '<form id="' + id + '" name="' + id + '" class="' + classes + '">';
  }
  else {
    this.formTag = '<form id="' + id + '" name="' + id + '">';
  }
  this.formBody = "";
  this.submitText = (options.submitText && typeof options.submitText === 'string') ? options.submitText : "Submit";
  this.bootstrapVersion = 3;
};

BootstrapForm.prototype.form = function () {
  return this.formTag
    + this.formBody
    + '<button type="submit" class="btn btn-success">' + this.submitText + '</button></form>';
}

BootstrapForm.prototype.addInput = function (id, type, label, options) {
  options = options || {};
  try {
    if (typeof id === 'undefined' || typeof id !== 'string') {
      throw new Error("Invalid argument: id not defined");
    }
    if (typeof type === 'undefined' || typeof type !== 'string') {
      throw new Error("Invalid argument: id not defined");
    }
    this.formBody += '<div class="form-group">';

    this.formBody += '<label for="' + id + '">' + label;
    if (options.info && typeof options.info === 'string') {
      this.formBody += ' <a href="#" data-toggle="tooltip" data-placement="right" title="' + options.info + '"><i class="fa fa-info-circle"></i></a>';
    }
    if (options.help_link && typeof options.help_link === 'object') {
      this.formBody += ' <a href="' + options.help_link.url || '#';
      this.formBody += '" target="_blank" data-toggle="tooltip" data-placement="right" title="' + options.help_link.title + '"><i class="fa fa-question-circle"></i></a>';
    }
    this.formBody += '</label>';

    this.formBody += '<input id="' + id + '" name="' + id + '" type="' + type + '"';
    if (options.classes && typeof options.classes === 'string') {
      this.formBody += ' class="form-control ' + options.classes + '"';
    }
    else {
      this.formBody += ' class="form-control"';
    }
    if (options.placeholder && typeof options.placeholder === 'string') {
      this.formBody += ' placeholder="' + options.placeholder + '"';
    }
    this.formBody += '>';

    if (options.help && typeof options.help === 'string') {
      this.formBody += '<p class="help-block">' + options.help + '</p>';
    }

    this.formBody += '</div>';
  }
  catch (e) {
    console.log("Failed to add input. \n" + e.message);
  }
}

var GridElement = function (el) {
  try {
    if (!(el instanceof jQuery)) {
      throw new Error("Invalid argument: Element is not a jQuery object");
    }
    this.sizex = el.data('sizex');
    this.sizey = el.data('sizex');
    this.row = el.data('row');
    this.col = el.data('col');
    this.name = el.data('name');
    this.element = el;
  }
  catch (e) {
    console.log("Failed to build GridElement. \n" + e.message);
  }
};
GridElement.prototype.save = function () {
  // Update properties
  var propertiesToNotSave = ['element'];
  for (var property in this) {
    if (this.hasOwnProperty(property)) {
      //a Don't save every property
      if ($.inArray(property, propertiesToNotSave) == -1) {
        this.element.data(property, this[property]);
      }
    }
  }

  // Update user-facing values
  this.element.children('.name').html(this.name);
}

GridElement.prototype.edit = function () {
  var prefix = 'editCell-';
  var formId = 'editCellForm';
  var gridEl = this;

  var cell = this.element;
  var data = cell.data();

  var form = new BootstrapForm(formId);
  for (var property in data) {
    if (data.hasOwnProperty(property)) {
      // Don't convert every property into an input
      if ($.inArray(property, ['coords', 'row', 'col', 'sizex', 'sizey']) == -1) {
        form.addInput(prefix+property, 'text', {label: property.toProperCase()});
      }
    }
  }
  var sidebarHtml = '<h2>Edit</h2>'
    + form.form()
    + '<button id="deleteCell" class="btn btn-danger">Delete</button>';
  $("#sidebar").html(sidebarHtml);

  // Set values
  $("#" + formId + " input").each(function () {
    $(this).val(gridEl[$(this)[0].id.replace(prefix, '')]);
  });

  // Handle deletion
  $("#deleteCell").click(function () {
    CSSGRIDGENERATOR.grid.grid.remove_widget(gridEl.element, function () {
      $("#st-container").removeClass('st-menu-open');
      // Wait to hide the form until the sidebar has closed
      // ref: http://stackoverflow.com/a/3473259
      $("#sidebar").delay(500).queue(function () {
        $(this).html('');
        $(this).dequeue();
      });
    });
  });

  // Build validation
  var validateOptions = {
    rules: {},
    submitHandler: function (form, event) {
      var formData = $(form).serializeArray();
      for (i = 0; i < formData.length; i++) {
        // TODO: Sanatize?
        gridEl[formData[i].name.replace(prefix, '')] = formData[i].value.trim();
      }
      gridEl.save();

      $("#st-container").removeClass('st-menu-open');
      // Wait to hide the form until the sidebar has closed
      // ref: http://stackoverflow.com/a/3473259
      $("#sidebar").delay(500).queue(function () {
        $(this).html('');
        $(this).dequeue();
      })
    },
  };
  // Note: Not all valid area names are valid <custom-ident>s
  // see:  http://www.w3.org/TR/css-grid-1/#valdef-grid-template-areas-string
  // Naive valid rexed based on
  // http://www.w3.org/TR/css-grid-1/#propdef-grid-template-areas
  // TODO: Improve regex -- add support for non-ASCII code point
  // Don't punish the user for extra whitespace. Remove it before we save.
  var areaNameValidRegex = /^\s*[0-9a-zA-Z-_]+\s*$/;
  validateOptions.rules[prefix+"name"] = { pattern: areaNameValidRegex };

  // Handle submission
  $("#" + formId).off('submit').on('submit', function (e) {
    e.preventDefault();
  }).validate(validateOptions);
};

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

  // Delete an element from the grid
  deleteElement: function (el) {
    try {
      if (!(el instanceof jQuery)) {
        throw new Error("Invalid argument: Element is not a jQuery object");
      }
      this.grid.remove_widget(el);
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

        var gridTemplateColumns = this.gridTemplateColumns.join(' ');
          gridTemplateRows = this.gridTemplateRows.join(' ');

        var gridTemplateAreas = "";
        for (var row in areas) {
          gridTemplateAreas += "\"" + areas[row].join(" ") + "\" ";
        }

        var gridTemplateAreas = "";
        for (y = 0; y < this.rows; y++) {
          gridTemplateAreas += (y > 0) ? " \"" : "\"";
          for (x = 0; x < this.cols; x++) {
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

/**
 * sidebarEffects.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
 var SidebarMenuEffects = SidebarMenuEffects || function() {

 	function hasParentClass( e, classname ) {
		if(e === document) return false;
		if( classie.has( e, classname ) ) {
			return true;
		}
		return e.parentNode && hasParentClass( e.parentNode, classname );
	}

	// http://coveroverflow.com/a/11381730/989439
	function mobilecheck() {
		var check = false;
		(function(a){if(/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	}

	function init() {

		var container = document.getElementById( 'st-container' ),
			buttons = Array.prototype.slice.call( document.querySelectorAll( '.st-trigger-effect' ) ),
			// event type (if mobile use touch events)
			eventtype = mobilecheck() ? 'touchstart' : 'click',
			resetMenu = function() {
				classie.remove( container, 'st-menu-open' );
			},
			bodyClickFn = function(evt) {
				if( !hasParentClass( evt.target, 'st-menu' ) ) {
					resetMenu();
					document.removeEventListener( eventtype, bodyClickFn );
				}
			};

		buttons.forEach( function( el, i ) {
			var effect = el.getAttribute( 'data-effect' );

			el.addEventListener( eventtype, function( ev ) {
				ev.stopPropagation();
				ev.preventDefault();
				container.className = 'st-container'; // clear
				classie.add( container, effect );
				setTimeout( function() {
					classie.add( container, 'st-menu-open' );
				}, 25 );
				document.addEventListener( eventtype, bodyClickFn );
			});
		} );

	}

	init();

};
