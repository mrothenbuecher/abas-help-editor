$(document).on("validation_call", function(event, arg1){
  //console.log("validate", arg1);

  $('#validationstate').removeClass("btn-outline-success");
  $('#validationstate').removeClass("btn-outline-danger");

  $('#validationstate').text("validating...");

  $.ajax({
    url: '/validate/xml/',
    data: JSON.stringify({
      'xml': arg1
    }),
    cache: false,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    method: 'POST',
    success: function(data) {
      if (data.xml && data.dtd.length) {
        // toastr['info']("xml valid")
        $('#validationstate').addClass("btn-outline-success");
        $('#validationstate').text("xml: valide");

      } else {
        $('#validationstate').addClass("btn-outline-danger");
        $('#validationstate').text("xml: not valide");
        // toastr['error'](JSON.stringify(data), "xml not valid")
      }
    },
    error: function(data) {
      $('#validationstate').addClass("btn-outline-danger");
      $('#validationstate').text("xml: not valide");
      //toastr['error'](JSON.stringify(data), "Validation failed")
    }
  }).always(function( data, textStatus, errorThrown ) {
      //console.log("Data: ", data);
  });

});
