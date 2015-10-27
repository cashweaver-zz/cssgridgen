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
