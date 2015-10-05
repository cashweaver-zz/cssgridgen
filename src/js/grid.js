String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

$(function(){ //DOM Ready

  $(".gridster ul").gridster({
    widget_margins: [10, 10],
    widget_base_dimensions: [140, 140],
    resize: {
      enabled: true
    }
  });
  var gridster = $(".gridster ul").gridster().data('gridster');

  // Add Cell
  $("#addCell").click(function () {
    var newCell = {
      html:
        "<li>" +
          "<button class='st-trigger-effect edit' data-effect='st-effect-3-right'>Edit</button>" +
          "<button class='delete'>Delete</button>" +
        "</li>",
      size_x: 1,
      size_y: 1,
      //col: 1,
      //row: 1
    }
    var cellHtml =
    gridster.add_widget(newCell.html, newCell.size_x, newCell.size_y);
  });

  $("#serializeGrid").click(function () {
    console.log(gridster.serialize());
  });

  $("#toggleDeleteMode").click(function () {
    $(".gridster").toggleClass("deleteModeEnabled");
    $(".gridster ul li .delete").click(function () {
      gridster.remove_widget($(this).parent());
    })
  });

  var editCellPrefix = 'editCell-'
  // Edit
  $(".gridster ul li .edit").click(function () {
    console.log(gridster);
    var cell = $(this).parent();
    var data = cell.data();

    // Build form
    var formHtml = "<h2>Edit Cell</h2><form id='editCellForm' name='editCellForm'>";
    for (var property in data) {
      if (data.hasOwnProperty(property)) {
        // Don't convert every property into an input
        if ($.inArray(property, ['coords', 'row', 'col', 'sizex', 'sizey']) == -1) {
        formHtml +=
          "<div class='form-group'>" +
            "<label for='" + editCellPrefix + property +"'>" + property.toProperCase() + "</label>" +
            "<input type='text' class='form-control' id='" + editCellPrefix + property + "'name='" + editCellPrefix + property + "'>" +
          "</div>";
        }
      }
    }
    formHtml += "<button type='submit' class='btn btn-default'>Save</button></form>";
    $("#editCellMenu").html(formHtml);

    // Set values
    $("#editCellForm input").each(function () {
      $(this).val(cell.data($(this)[0].id.replace(editCellPrefix, '')));
    });

    // Handle submission
    $("#editCellForm").off('submit').on('submit', function () {
      var dataArray = $(this).serializeArray();
      for (i = 0; i < dataArray.length; i++) {
        // TODO: Sanatize?
        cell.data(dataArray[i].name.replace(editCellPrefix, ''), dataArray[i].value);
      }
      return false;
    });
  });


  // Export
  $("#export").click(function () {
    console.log(gridster.serialize());
    var exportCSS = "",
      lineBreak = "<br>";
    var id, gridColumn, gridRow;
    var numCols = 0,
      numRows = 0;

    gridster.serialize().forEach(function (cell, index) {
      selector = "area-" + (index + 1);
      gridColumn = cell.col.toString() + ((cell.size_x != 1) ? " / span " + cell.size_x : "");
      gridRow = cell.row.toString() + ((cell.size_y != 1) ? " / span " + cell.size_y : "");
      exportCSS +=
        "#" + selector + " {" +
        "grid-column: " + gridColumn + ";" +
        " grid-row: " + gridRow + ";" +
        "}" + lineBreak;

      numCols = ((cell.col + cell.size_x - 1) > numCols) ? (cell.col + cell.size_x - 1) : numCols;
      numRows = ((cell.row + cell.size_y - 1) > numRows) ? (cell.row + cell.size_y - 1) : numRows;
    });

    var gridTemplateColumns = "auto",
      gridTemplateRows = "auto";

    for (i = 1; i < numCols; i++) {
       gridTemplateColumns += " auto";
    }
    for (i = 1; i < numRows; i++) {
       gridTemplateRows += " auto";
    }

    exportCSS =
      "#grid {" + lineBreak +
      "  grid-template-columns: " + gridTemplateColumns + ";" + lineBreak +
      "  grid-template-rows: " + gridTemplateRows + ";" + lineBreak +
      "}" + lineBreak +
      exportCSS;
    $("#exportResult").html(exportCSS);
  });
});
