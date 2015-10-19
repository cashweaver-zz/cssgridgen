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
  var sidebarHtml = '<h2>Edit</h2>' + form.form();
  $("#sidebar").html(sidebarHtml);

  // Set values
  $("#" + formId + " input").each(function () {
    $(this).val(gridEl[$(this)[0].id.replace(prefix, '')]);
  });

  // Handle submission
  $("#" + formId).off('submit').on('submit', function () {
    var formData = $(this).serializeArray();
    for (i = 0; i < formData.length; i++) {
      // TODO: Sanatize?
      //cell.data(formData[i].name.replace(prefix, ''), formData[i].value);
      gridEl[formData[i].name.replace(prefix, '')] = formData[i].value;
    }
    gridEl.save();
    return false;
  });
};
