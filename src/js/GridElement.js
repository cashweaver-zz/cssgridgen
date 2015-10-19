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
  var propertiesToNotSave = ['element'];
  for (var property in this) {
    if (this.hasOwnProperty(property)) {
      // Don't save every property
      if ($.inArray(property, propertiesToNotSave) == -1) {
        this.element.data(property, this[property]);
      }
    }
  }
}

GridElement.prototype.edit = function () {
  var prefix = 'editCell-';
  var formId = 'editCellForm';
  var gridEl = this;

  var cell = this.element;
  var data = cell.data();


  function buildFormInput(prefix, property) {
    return "<div class='form-group'>" +
      "<label for='" + prefix + property +"'>" + property.toProperCase() + "</label>" +
      "<input type='text' class='form-control' id='" + prefix + property + "'name='" + prefix + property + "'>" +
    "</div>";
  }

  function buildForm() {
    var formHtml = "<h2>Edit Cell</h2>";
    formHtml += "<form id='" + formId + "' name='" + formId + "'>";

    for (var property in data) {
      if (data.hasOwnProperty(property)) {
        // Don't convert every property into an input
        if ($.inArray(property, ['coords', 'row', 'col', 'sizex', 'sizey']) == -1) {
          formHtml += buildFormInput(prefix, property);
        }
      }
    }

    formHtml += "<button type='submit' class='btn btn-default'>Save</button></form>";
    return formHtml;
  }
  $("#sidebar").html(buildForm());

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
