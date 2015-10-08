String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

$(function(){ //DOM Ready

  $(".gridster ul").gridster({
    widget_margins: [10, 10],
    widget_base_dimensions: [140, 140],
    serialize_params: function($w, wgd) {
      var result = {
        col: wgd.col,
        row: wgd.row,
        size_x: wgd.size_x,
        size_y: wgd.size_y,
        name: wgd.el.data('name')
      };
      return result;
    },
    resize: {
      enabled: true
    }
  });
  var gridster = $(".gridster ul").gridster().data('gridster');

  // Add Cell
  $("#addCell").click(function () {
    var newCell = {
      html:
        "<li data-name=''>" +
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

  // Edit
  var editCellPrefix = 'editCell-'
  $(".gridster ul li .edit").click(function () {
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

  // Build a CSS rule set
  function buildCSS(obj, tab, newLine) {
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
  function getCellIndexMethod() {
    var validAreas = true;
    gridster.serialize().forEach(function (cell, index) {
      if (!cell.hasOwnProperty('name') || typeof cell.name != "string" || (!cell.name || cell.name.length === 0)) {
        validAreas = false;
      }
    });

    return (validAreas) ? "areas" : "coords";
  }

  // Called for each cell to determine the grid's dimensions
  function updateGridDimensions(gd, cell) {
    gd.x = ((cell.col + cell.size_x - 1) > gd.x) ? (cell.col + cell.size_x - 1) : gd.x;
    gd.y = ((cell.row + cell.size_y - 1) > gd.y) ? (cell.row + cell.size_y - 1) : gd.y;
  }

  // Export CSS which defines the current state of the grid
  $("#export").click(function () {
    var numCols = 0, numRows = 0;
    var gridDimensions = {
      'x': 0,
      'y': 0
    }
    var cellIndexMethod = getCellIndexMethod();
    var css = "";

    switch (cellIndexMethod) {
      case "areas":
        var areas = [];
        gridster.serialize().forEach(function (cell, index) {
          css += buildCSS({
            'selector': "#area-" + (index + 1),
            'properties': {
              'grid-area': cell.name
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

          updateGridDimensions(gridDimensions, cell);
        });

        var gridTemplateColumns = "auto",
          gridTemplateRows = "auto";

        for (i = 1; i < gridDimensions.x; i++) {
           gridTemplateColumns += " auto";
        }
        for (i = 1; i < gridDimensions.y; i++) {
           gridTemplateRows += " auto";
        }

        var gridTemplateAreas = "";
        for (var row in areas) {
          gridTemplateAreas += "\"" + areas[row].join(" ") + "\" ";
        }

        var gridTemplateAreas = "";
        for (y = 0; y < gridDimensions.y; y++) {
          gridTemplateAreas += (y > 0) ? " \"" : "\"";
          for (x = 0; x < gridDimensions.x; x++) {
            gridTemplateAreas += (x > 0) ? " " : "";
            gridTemplateAreas += (typeof areas[y][x] !== 'undefined') ? areas[y][x] : '.';
          }
          gridTemplateAreas += "\"";
        }

        css = buildCSS({
          'selector': "#grid",
          'properties': {
            'display': "grid",
            'grid-template-areas': gridTemplateAreas,
            'grid-template-columns': gridTemplateColumns,
            'grid-template-rows': gridTemplateRows,
          }
        }) + css;
        break;
      case "coords":
        gridster.serialize().forEach(function (cell, index) {
          css += buildCSS({
            'selector': "#area-" + (index + 1),
            'properties': {
              'grid-column-start': cell.col,
              'grid-column-end': cell.col + cell.size_x,
              'grid-row-start': cell.row,
              'grid-row-end': cell.row + cell.size_y,
            }
          });
          updateGridDimensions(gridDimensions, cell);
        });

        var gridTemplateColumns = "auto",
          gridTemplateRows = "auto";

        for (i = 1; i < gridDimensions.x; i++) {
           gridTemplateColumns += " auto";
        }
        for (i = 1; i < gridDimensions.y; i++) {
           gridTemplateRows += " auto";
        }

        css = buildCSS({
          'selector': "#grid",
          'properties': {
            'display': "grid",
            'grid-template-columns': gridTemplateColumns,
            'grid-template-rows': gridTemplateRows,
          }
        }) + css;
        break;
      default:
        break;
    }

    $("#exportResult").html(css);
  });
});

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
 var SidebarMenuEffects = (function() {

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

})();
