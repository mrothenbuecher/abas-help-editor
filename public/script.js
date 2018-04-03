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

window.onload = function() {
  //var converter = new showdown.Converter();
  var pad = document.getElementById('pad');
  var htmlArea = document.getElementById('html-content');
  var xmlArea = document.getElementById('xml-content');


  Split(['#input', '#output'], {
    sizes: [50, 50]
  });


  Split(['#html', '#xml'], {
    sizes: [50, 50],
    direction: 'vertical'
  });

  /*
  Split(['#input', '#xml'], {
    sizes: [50, 50]
  });
  */
  // make the tab act like a tab

  var caretPosition;
  var lastOP;

  var carets = {};


  function updateCaret() {

    var oldCaretPosition = caretPosition;

    var $pad = $('#pad')[0];

    if ($pad.selectionStart < $pad.selectionEnd)
      caretPosition = $pad.selectionStart;
    else
      caretPosition = $pad.selectionEnd;
    // convertTextAreaToMarkdown();

    if (oldCaretPosition != caretPosition) {

      if (!lastOP) {
        lastOP = {
          p: [username],
          li: caretPosition
        };
      } else {
        lastOP = {
          p: [username],
          ld: oldCaretPosition,
          li: caretPosition
        };
      }
      infoDocument.submitOp([lastOP]);
    }
  }

  infoDocument.subscribe(function(err) {
    if (err) throw err;

    $("#pad").bind("keydown keypress keyup click focus", function() {
      updateCaret();
    });



    $("#pad").bind("blur", function() {
      var oldCaretPosition = caretPosition;
      caretPosition = null;

      if (lastOP) {
        lastOP = {
          p: [username],
          ld: oldCaretPosition
        };
        infoDocument.submitOp([lastOP]);
      }
    });


    $(window).on("beforeunload", function() {
      var oldCaretPosition = caretPosition;
      caretPosition = null;

      if (lastOP) {
        lastOP = {
          p: [username],
          ld: oldCaretPosition
        };
        infoDocument.submitOp([lastOP]);
      }
    });

    infoDocument.on('op', function(op, source) {
      //console.log("Op:", op, source);
      carets[op[0].p[0]] = op[0].li;
      convertTextAreaToMarkdown();
    });
  });

  pad.addEventListener('keydown', function(e) {
    if (e.keyCode === 9) { // tab was pressed
      // get caret position/selection
      var start = this.selectionStart;
      var end = this.selectionEnd;

      var target = e.target;
      var value = target.value;

      // set textarea value to: text before caret + tab + text after caret
      target.value = value.substring(0, start) +
        "\t" +
        value.substring(end);

      // put caret at right position again (add one for the tab)
      this.selectionStart = this.selectionEnd = start + 1;

      // prevent the focus lose
      e.preventDefault();
    }
  });

  var previousMarkdownValue;

  // convert text area to markdown html
  var convertTextAreaToMarkdown = function() {
    var markdownText = pad.value;

    previousMarkdownValue = markdownText;

    xml = markdownxml.getPlainXml(markdownText);
    xml = pd.xml(xml);

    // insert carets
    if (carets) {

      keysSorted = Object.keys(carets).sort(function(a, b) {
        return carets[a] - carets[b]
      })

      for (var i = 0; i < keysSorted.length; i++) {
        var cp = carets[keysSorted[i]] + (2 * i);
        if (cp != null && cp >= 0) {
          markdownText = [markdownText.slice(0, cp), '$$', markdownText.slice(cp)].join('');
        }
      }

      for (var i = 0; i < keysSorted.length; i++) {
        var cp = carets[keysSorted[i]] + (2 * i);
        if (cp != null && cp >= 0) {
          markdownText = markdownText.replace(/\$\$/, '<span class="cursor" style="color:#' + keysSorted[i].toARGB() + ';">|<i>' + keysSorted[i] + '</i></span>');
        }
      }

    }

    html = markdownhtml.getAbasHtml(markdownText);
    var $html = $('<div />',{html:html});
     // generate table of contents if necessary
    if($html.find('contents').length > 0){
      $.each($html.find('contents'), function(i, val){
        $val = $(val);
        var query = "";
        var max = 7;
        // which is the max level
        if(parseInt($val.attr("MAXLEVEL"))){
          max = parseInt($val.attr("MAXLEVEL"))+1;
        }
        // first ??
        var first = false;
        if(parseInt($val.attr("FIRST"))){
          first = true;
        }
        // generate search query
        for(i=1;i<max;i++){
          if($val.attr("ID")){
            if(first)
              query+="h"+i+"[ID^='"+$val.attr("ID")+"']";
            else
              query+="h"+i+"[ID^='"+$val.attr("ID")+".']";
          }else{
            query+="h"+i
          }
          if(i<max-1){
            query+=","
          }
        }
        // handle found Headings

        var headings = $html.find(query);

        if(headings.length > 0){
          var content  ="";
          if($val.attr("TITLE")){
            content = "<h1>"+$val.attr("TITLE")+"</h1>";
          }
          $.each(headings, function(j, head){
            var $head = $(head);
            content+='<p><a href="#'+$head.attr("ID")+'">'+$head.text()+'</a></p>'
          });
          $val.replaceWith(content);
          console.log("Query:",query,"Headings:", $html.find(query));
        }

      });
    }
    htmlArea.innerHTML = $html.html();
    //xmlArea.innerHTML = xml.encodeHTML().replace(/(?:\r\n|\r|\n)/g, '<br />');
    $('#xml-content').val(xml);
  };

  var didChangeOccur = function() {
    if (previousMarkdownValue != pad.value) {
      return true;
    }
    return false;
  };

  // check every second if the text area has changed
  setInterval(function() {
    if (didChangeOccur()) {
      updateCaret();
      convertTextAreaToMarkdown();
    }
  }, 1000);

  // convert textarea on input change
  pad.addEventListener('input', convertTextAreaToMarkdown);

  // Uploading files
  $('#pad').on("drop", function(event) {
    event.preventDefault();
    //event.stopPropagation();
    if (event.originalEvent.dataTransfer.files.length > 0) {

      var foo = event.originalEvent.dataTransfer.files;
      $.each(foo, function(i, file) {
        var data = new FormData();
        //console.log("File:", file);
        data.append('file', file);
        $.ajax({
          url: '/upload/'+docName+"/",
          data: data,
          cache: false,
          contentType: false,
          processData: false,
          method: 'POST',
          type: 'POST', // For jQuery < 1.9
          success: function(data) {
            //alert(data);
            var content = $('#pad').val();
            var newContent = "";
            var position = $("#pad").getCursorPosition();

            if(data.isImg){
              newContent = content.substr(0, position) + '!['+file.name+'](/'+data.path+'/'+encodeURIComponent(docName+'_'+file.name)+')' + content.substr(position);
              //$('#pad').insertAtCaret('!['+file.name+']('+data.path+'/'+docName+'_'+file.name+')');
            }else{
              newContent = content.substr(0, position) + '['+file.name+'](/'+data.path+'/'+encodeURIComponent(docName+'_'+file.name)+')' + content.substr(position);
              //$('#pad').insertAtCaret('['+file.name+']('+data.path+'/'+docName+'_'+file.name+')');
            }
            $('#pad').val(newContent);
            toastr['success'](file.name, "Upload successfull");

          }
        });
      });
    }
    return false;
  });

  // convert on page load
  convertTextAreaToMarkdown();

};
