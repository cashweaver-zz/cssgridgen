// DOM Ready
$(function () {
  $('#grid').gridster({
    widget_margins: [10, 10],
    widget_base_dimensions: [140, 140],
    serialize_params: function($w, wgd) {
      var result = {
        col: wgd.col,
        row: wgd.row,
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

  // Handle editing and saving a grid element
  $('#grid .edit').click(function () {
    var gridEl = new GridElement($(this).parent());
    gridEl.edit();
  });

  $("#export").click(function () {
     CSSGRIDGENERATOR.grid.exportCSS();
  });
});
