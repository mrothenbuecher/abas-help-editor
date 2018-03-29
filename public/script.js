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
    return val;
  };
}


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

  infoDocument.subscribe(function(err) {
    if (err) throw err;

    $("#pad").bind("keydown keypress keyup click focus", function() {

      var oldCaretPosition = caretPosition;

      if (this.selectionStart < this.selectionEnd) {
        caretPosition = this.selectionStart;
      } else caretPosition = this.selectionEnd;
      convertTextAreaToMarkdown();

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
      console.log("Op:", op, source);
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
    if (carets) {

      keysSorted = Object.keys(carets).sort(function(a, b) {
        return carets[a] - carets[b]
      })

      for (var i = 0; i < keysSorted.length; i++) {
        var cp = carets[keysSorted[i]] + (3 * i);
        if (cp != null && cp >= 0) {
          //if(i>0)
          //  cp += (1*i);
          markdownText = [markdownText.slice(0, cp), '$$', markdownText.slice(cp)].join('');
        }
      }

    }

    previousMarkdownValue = markdownText;
    //console.log("XML: ",markdownxml);
    //html = converter.makeHtml(markdownText);
    xml = markdownxml.getPlainXml(markdownText);
    xml = pd.xml(xml);
    html = markdownhtml.getAbasHtml(markdownText);
    htmlArea.innerHTML = html;
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
      convertTextAreaToMarkdown();
    }
  }, 1000);

  // convert textarea on input change
  pad.addEventListener('input', convertTextAreaToMarkdown);

  // convert on page load
  convertTextAreaToMarkdown();

};
