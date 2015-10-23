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
      $("#sidebar").html('');
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
      // TODO: add delay
      $("#sidebar").html('');
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
