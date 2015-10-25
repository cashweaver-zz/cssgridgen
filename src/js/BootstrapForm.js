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
