/**
 *
 * snarkdown 1.2.2
 * based on https://github.com/developit/snarkdown
 */

var markdownhtml = {
  TAGS: function() {
    return {
      '$': [''],
      '': ['<REF>', '</REF>'],
      _: ['<B>', '</B>'],
      '*': ['<tt class="abas">', '</tt>'],
      '\n': ['<BR />\n'],
      ' ': ['<BR />\n'],
      '-': ['\n<HR />\n']
    };
  },

  /** Outdent a string based on the first indented line's leading whitespace
   *	@private
   */
  outdent: function(str) {
    return str.replace(RegExp('^' + (str.match(/^(\t| )+/) || '')[0], 'gm'), '');
  },

  /** Encode special attribute characters to HTML entities in a String.
   *	@private
   */
  encodeAttr: function(str) {
    return (str + '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  /** Parse Markdown into an HTML String. */
  parse: function(md) {
    var tokenizer = /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^```(\w*)\n([\s\S]*?)\n```$)|(?:^```(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:\!\[([^\]]*?)\]\(([^\)].+)\))|(\[)|(\](?:\(([^\)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(\-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,6}))\s*(?:\{(?:([a-zA-Z].*?))\})?(.+)(?:\n+|$)|(?:`\n([\s\S]*?)\n`)|(  \n\n*|\n{2,}|__|\*{2,}|\${2})|(?:\*(?:\{([a-zA-Z].*)\})?\s*(.*)?\*)|(?:\{\{([a-zA-Z].*)+\}\})|(?:(?:^|\n+)(\.{2}))\s*(?:\{(?:([a-zA-Z].*?))\})?(.+)(?:\n+|$)|((?:(?:^|\n)([;;]{2})\s+.*)+)|(?:~(?:\{(.*)\}){1}(.*)*\n([\s\S]*?)\n~)/gm,
      //|(?:^(.*)$)
      // (?:^(.*?)\n)
      context = [],
      out = '',
      last = 0,
      links = {},
      chunk, prev, token, inner, t;

    function tag(token) {
      var desc = markdownhtml.TAGS()[token.replace(/\*/g, '*')[1] || ''],
        end = context[context.length - 1] == token;
      if (!desc) {
        return token;
      }
      if (!desc[1]) {
        return desc[0];
      }
      context[end ? 'pop' : 'push'](token);
      return desc[end | 0];
    }

    function flush() {
      var str = '';
      while (context.length) {
        str += tag(context[context.length - 1]);
      }
      return str;
    }

    md = md.replace(/^\[(.+?)\]:\s*(.+)$/gm, function(s, name, url) {
      links[name.toLowerCase()] = url;
      return '';
    }).replace(/^\n+|\n+$/g, '');

    while ((token = tokenizer.exec(md))) {
      prev = md.substring(last, token.index);
      last = tokenizer.lastIndex;
      chunk = token[0];
      if (prev.match(/[^\\](\\\\)*\\$/)) {
        // escaped
      }
      // PRE:
      else if (token[3] || token[4]) {
        chunk = '<PRE>' + markdownhtml.outdent(markdownhtml.encodeAttr(token[3] || token[4]).replace(/^\n+|\n+$/g, '')) + '</PRE>\n';
      }
      // > Quotes, -* lists:
      else if (token[6]) {
        t = token[6];
        if (t.match(/\./)) {
          token[5] = token[5].replace(/^\d+/gm, '');
        }
        inner = markdownhtml.parse(markdownhtml.outdent(token[5].replace(/^\s*[>*+.-]/gm, '')));
        if (t === '>') {
          t = 'P';
          chunk = '<' + t + '>' + inner + '</' + t + '>\n';
        } else {
          t = t.match(/\./) ? 'ol' : 'ul';
          inner = inner.replace(/^(.*)(\n|$)/gm, '\t<li>$1</li>\n');
          chunk = '<' + t + ' class="abas-list">\n' + inner + '</' + t + '>\n';
        }

      }
      // Images:
      else if (token[8]) {
        chunk = "<IMG SRC=\"" + (markdownhtml.encodeAttr(token[8])) + "\" ALT=\"" + (markdownhtml.encodeAttr(token[7])) + "\" />\n";
      }
      // Links:
      else if (token[10]) {
        out = out.replace('<A>', ("<A HREF=\"" + (markdownhtml.encodeAttr(token[11] || links[prev.toLowerCase()])) + "\">"));
        chunk = flush() + '</A>\n';
      } else if (token[9]) {
        chunk = '<A>';
      }
      // Headings:
      else if (token[12] || token[14]) {
        t = 'h' + (token[14] ? token[14].length : (token[13][0] === '=' ? 1 : 2));

        var id = token[15];
        var split = null;
        if (id && (foo = id.split(",")).length) {
          id = foo[0];
          split = foo[1];
        }

        chunk = '<' + t + (id ? ' ID="' + id + '" ' : "")+' class="abas-header">' + markdownhtml.parse(token[12] || token[16]) + '</' + t + '>\n';
      }
      // `PROGRAM`:
      else if (token[17]) {
        chunk = '<pre class="abas-program">' + markdownhtml.outdent(markdownhtml.encodeAttr(token[17]).replace(/^\n+|\n+$/g, '')) + '</pre>';
      }

      // Inline formatting: **strong** & hr & br
      else if (token[18] || token[1]) {
        chunk = tag(token[18] || '--');
      }
      // REF
      else if (token[19] && token[20]) {
        chunk = '<a href="#'+token[19]+'">' + token[20] + '</a>'
      }
      // MARK
      else if (token[21]) {
        chunk = '<MARK ID="' + token[21] + '" />';
      }
      // H
      else if (token[22]) {
        chunk = '<H ' + (token[23] ? 'ID="' + token[23] + '"' : "") + '>' + token[24] + '</H>\n'
        //chunk = '<MARK ID="'+token[21]+'" />';
      // DL - definition list
      } else if (token[26]) {
        t = token[26];
        // ;; abschneiden
        inner = markdownhtml.parse(markdownhtml.outdent(token[25].replace(/^\s*[;]{2}/gm, '')));
        inner = inner.replace(/\|\|/gm, '</td><td class="DD" bgcolor="#FFFFFF" style="FONT-FAMILY:Segoe UI,Arial,Helvetica,sans-serif;font-size:100%" valign="top">' );
        inner = inner.replace(/^(?:\{(.*)\})(.*)(\n|$)/gm, '<tr><td class="DT" bgcolor="#CBCCCE" style="FONT-FAMILY:Segoe UI,Arial,Helvetica,sans-serif;font-size:100%" valign="top">$1</td><td class="DD" bgcolor="#FFFFFF" style="FONT-FAMILY:Segoe UI,Arial,Helvetica,sans-serif;font-size:100%" valign="top">$2</td></tr>');

        // zusammenbauen
        chunk = '<table class="DL" bgcolor="#CBCCCE" border="1" cellpadding="5" cellspacing="1" style="border-collapse:collapse;border-color:#CBCCCE"><tbody>' + inner + '</tbody></table>';
      }
      // PP
      else if (token[27]) {
        chunk = '<div class="abas-pp ' + token[27] + '" ><h1 class="pp-header">'+token[27]+':'+(token[28]?token[28]:"")+'</h1><br/>'+markdownhtml.parse(markdownhtml.outdent(token[29]))+'</div>';
      }
      out += prev;
      out += chunk;
    }
    return (out + md.substring(last) + flush()).trim();
  },
  getAbasHtml: function(md) {
    return '<div id="top"><h1 style="font-size: 100%;">help</h1></div>' + markdownhtml.parse(md) + '<div id="bottom"></div><div id="footer"></div>';
  }
};
