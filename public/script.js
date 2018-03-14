window.onload = function() {
  var converter = new showdown.Converter();
  var pad = document.getElementById('pad');
  var htmlArea = document.getElementById('html-content');
  var xmlArea = document.getElementById('xml-content');

  console.log(markdownxml);

  Split([ '#input', '#output'], {
    sizes: [50, 50]
  });

  Split(['#html', '#xml'], {
    sizes: [50, 50],
    direction: 'vertical'
  });

  // make the tab act like a tab
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
    //console.log("XML: ",markdownxml);
    html = converter.makeHtml(markdownText);
    xml = markdownxml.parse(markdownText);
    htmlArea.innerHTML = html;
    xmlArea.innerHTML = html;
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
