$(document).ready(function() {

  var $pad = $('#pad');
  var $htmlArea = $('#html-content');
  var $xmlArea = $('#xml-content');

  var caretPosition;
  var lastOP;

  var carets = {};


  function updateCaret() {

    var oldCaretPosition = caretPosition;

    var hpad = $pad[0];

    if (hpad.selectionStart < hpad.selectionEnd)
      caretPosition = hpad.selectionStart;
    else
      caretPosition = hpad.selectionEnd;
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

    $pad.bind("keydown keypress keyup click focus", function() {
      updateCaret();
    });

    $pad.bind("blur", function() {
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
      carets[op[0].p[0]] = op[0].li;
      convertTextAreaToMarkdown();
    });
  });

  $pad.keydown(function(e) {
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
    var markdownText = $pad.val();

    previousMarkdownValue = markdownText;

    xml = markdownxml.getPlainXml(markdownText);
    xml = pd.xml(xml);

    $(document).trigger("validation_call", [xml]);

    // Update Subwindow
    if (xmlWindow) {
      xmlWindow.document.write('<html><head><link rel="shortcut icon" href="/favicon.ico"><link href="/style.css" rel="stylesheet"><link href="/abas-style.css" rel="stylesheet"><div id="xml"></head><body><textarea autofocus id="xml-content" disabled>' + xml + '</textarea></div></body></html>');
      xmlWindow.document.close();
    }

    // insert carets

    var me = false;

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
          //FIXME if two user have the same name this won't work
          if(keysSorted[i]==user){
            me = true;
          }
          markdownText = markdownText.replace(/\$\$/, '<span '+(keysSorted[i]==user?'id="me"':'')+' class="cursor" style="color:#' + keysSorted[i].toARGB() + ';">|<i>' + keysSorted[i] + '</i></span>');
          //markdownText = markdownText.replace(/\$\$/, '<span class="cursor" style="color:#' + keysSorted[i].toARGB() + ';">|<i>' + keysSorted[i] + '</i></span>');
        }
      }

    }

    html = markdownhtml.getAbasHtml(markdownText);
    var $html = $('<div />', {
      html: html
    });
    // generate table of contents if necessary
    if ($html.find('contents').length > 0) {
      $.each($html.find('contents'), function(i, val) {
        $val = $(val);
        var query = "";
        var max = 7;
        // which is the max level
        if (parseInt($val.attr("MAXLEVEL"))) {
          max = parseInt($val.attr("MAXLEVEL")) + 1;
        }
        // first ??
        var first = false;
        if (parseInt($val.attr("FIRST"))) {
          first = true;
        }
        // generate search query
        for (i = 1; i < max; i++) {
          if ($val.attr("ID")) {
            if (first)
              query += "h" + i + "[ID^='" + $val.attr("ID") + "']";
            else
              query += "h" + i + "[ID^='" + $val.attr("ID") + ".']";
          } else {
            query += "h" + i
          }
          if (i < max - 1) {
            query += ","
          }
        }
        // handle found Headings

        var headings = $html.find(query);

        if (headings.length > 0) {
          var content = "";
          if ($val.attr("TITLE")) {
            content = "<h1>" + $val.attr("TITLE") + "</h1>";
          }
          $.each(headings, function(j, head) {
            var $head = $(head);
            var $heading = $head.clone();
            $heading.find('.cursor').remove();
            content += '<p><a href="#' + $heading.attr("ID") + '">' + $heading.text() + '</a></p>'
          });
          $val.replaceWith(content);
        }

      });
    }

    $htmlArea.html($html.html());

    if(me){
      $htmlArea.animate({
          scrollTop: $("#me").offset().top - $htmlArea.offset().top + $htmlArea.scrollTop()
      }, 100);
    }

    //Update subwindow
    if (prevWindow) {
      prevWindow.document.write('<html><head><link rel="shortcut icon" href="/favicon.ico"><title>preview</title><link href="/style.css" rel="stylesheet"><link href="/abas-style.css" rel="stylesheet"></head><body>' + $('#html-content').get(0).outerHTML + "</body></html>");
      prevWindow.document.close();
    }

    // console.log(xml);
    $xmlArea.html(escapeHtml(xml));
    $xmlArea.data("xml",xml);

    //$xmlArea.val(xml);

  };

  function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/(\n|\r\n)/g, "<br/>")
         .replace(/\t/g, "&emsp;")
         .replace(/ /g, "&nbsp;");
 }

  var didChangeOccur = function() {
    if (previousMarkdownValue != $pad.val()) {
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
  $pad.on('input', convertTextAreaToMarkdown);

  // convert on page load
  convertTextAreaToMarkdown();

});
