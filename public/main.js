if (!String.prototype.encodeHTML) {
  String.prototype.encodeHTML = function() {
    return this.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  };
}

if (!String.prototype.decodeHTML) {
  String.prototype.decodeHTML = function() {
    return this.replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;&nbsp;&nbsp;&nbsp;/g, '\t');
  };
}

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
  };
}

if (!String.prototype.hashCode) {
  String.prototype.hashCode = function() {
    var hash = 0;
    for (var i = 0; i < this.length; i++) {
      hash = this.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
}

if (!String.prototype.toARGB) {
  String.prototype.toARGB = function() {
    var i = this.hashCode();
    var val = ((i >> 24) & 0xFF).toString(16) +
      ((i >> 16) & 0xFF).toString(16) +
      ((i >> 8) & 0xFF).toString(16) +
      (i & 0xFF).toString(16);
    while (val.length < 6)
      val = val + '0';
    val = val.slice(0, 6);
    return val;
  };
}

(function ($, undefined) {
    $.fn.getCursorPosition = function () {
        var el = $(this).get(0);
        var pos = 0;
        if ('selectionStart' in el) {
            pos = el.selectionStart;
        } else if ('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    }
})(jQuery);

var prevWindow = null;
var xmlWindow = null;

$(document).ready(function() {

  var $htmlArea = $('#html-content');
  var $xmlArea = $('#xml-content');

  Split(['#input', '#output'], {
    sizes: [50, 50]
  });


  Split(['#html', '#xml'], {
    sizes: [50, 50],
    direction: 'vertical'
  });

  var $pad = $('#pad');

  // Uploading files
  $pad.on("drop", function(event) {
    event.preventDefault();
    //event.stopPropagation();
    if (event.originalEvent.dataTransfer.files.length > 0) {

      var foo = event.originalEvent.dataTransfer.files;
      $.each(foo, function(i, file) {
        var data = new FormData();
        data.append('file', file);
        $.ajax({
          url: '/upload/' + docName + "/",
          data: data,
          cache: false,
          contentType: false,
          processData: false,
          method: 'POST',
          type: 'POST', // For jQuery < 1.9
          success: function(data) {
            //alert(data);
            var content = $pad.val();
            var newContent = "";
            var position = $pad.getCursorPosition();

            if (data.isImg) {
              newContent = content.substr(0, position) + '![' + file.name + '](/' + data.path + '/' + encodeURIComponent(docName + '_' + file.name) + ')' + content.substr(position);
            } else {
              newContent = content.substr(0, position) + '[' + file.name + '](/' + data.path + '/' + encodeURIComponent(docName + '_' + file.name) + ')' + content.substr(position);
            }
            $pad.val(newContent);
            toastr['success'](file.name, "Upload successfull");

          }
        });
      });
    }
    return false;
  });

  $('#prev-window').click(function(ev){
    prevWindow = window.open("", "preview", "width=300,height=400,scrollbars=yes,titlebar=no,location=no");
    prevWindow.document.write('<html><head><link rel="shortcut icon" href="/favicon.ico"><title>preview</title><link href="/style.css" rel="stylesheet"><link href="/abas-style.css" rel="stylesheet"></head><body>'+$('#html-content').get(0).outerHTML+'</body></html>');
    prevWindow.document.close();
  });

  $('#xml-window').click(function(ev){
    xmlWindow = window.open("", "xml", "width=300,height=400,scrollbars=yes,titlebar=no,location=no");
    xmlWindow.document.write('<html><head><link rel="shortcut icon" href="/favicon.ico"><link href="/style.css" rel="stylesheet"><link href="/abas-style.css" rel="stylesheet"><div id="xml"></head><body><textarea autofocus id="xml-content" disabled>'+$('#xml-content').val()+'</textarea></div></body></html>');
    xmlWindow.document.close();
  });

  $('#validate-xml').click(function() {
    $.ajax({
      url: '/validate/xml/',
      data: JSON.stringify({
        'xml': $xmlArea.val()
      }),
      cache: false,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      method: 'POST',
      success: function(data) {
        console.log("Data: ", data);
        if (data.xml && data.dtd.length) {
          toastr['info']("xml valid")
        } else {
          toastr['error'](JSON.stringify(data), "xml not valid")
        }
      },
      error: function(data) {
        toastr['error'](JSON.stringify(data), "Validation failed")
      }
    });
  });

  $('#save-xml').click(function() {
    var xmlContent = $xmlArea.val();
    $.ajax({
      url: '/store/xml/' + docName,
      data: JSON.stringify({
        'xml': xmlContent
      }),
      cache: false,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      method: 'POST',
      success: function(data) {
        console.log("Data: ", data);
        if (data.stored) {
          toastr['info']("xml stored")
        } else {
          console.error("xml not stored", data);
          toastr['error']("see console", "xml not stored")
        }
      },
      error: function(data) {
        console.error("storing failed", data);
        toastr['error']("see console", "storing failed")
      }
    });
  });
});
