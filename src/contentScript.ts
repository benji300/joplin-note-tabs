// import { Editor } from "codemirror";

module.exports = {
  default: function (context: any) {

    const plugin = function (CodeMirror) {
      CodeMirror.defineExtension('getLinkedNoteId', async function (from, to) {
        let noteId: string;
        let cm = this;

        // retrieve current cursor position and line
        const cursor: any = cm.getCursor();
        if (!cursor) return;
        const line: any = cm.getLine(cursor.line);
        if (!line) return;

        // https://github.com/roman-r-m/joplin-plugin-quick-links/blob/master/src/QuickLinksPlugin.ts
        // https://github.com/roman-r-m/joplin-plugin-table-formatter/blob/master/src/TableFormatter.ts
        // console.log(`tokenAt: ${JSON.stringify(cm.getTokenAt(cursor).line)}`);
        console.log(`cursor: ${JSON.stringify(cursor)}`);
        console.log(`line: ${JSON.stringify(line)}`);
        console.log(`from: ${from}`);
        console.log(`to: ${to}`);

        // cm.getLine(startLine).trimStart().charAt(0)
        // cm.replaceRange(formatted, { line: startLine, ch: 0 }, { line: endLine, ch: 0 })

        // parse line content for internal link and extract noteID
        // TODO complete line might be wrong in case of two links in one line
        const urlRegEx = /\[(.*)\]\(:\/([0-9a-zA-Z]+)\)/g;
        const urlMatch: RegExpExecArray = urlRegEx.exec(line);
        if (urlMatch && urlMatch.length > 0) {
          // urlMatch[2]
        }

        // TODO move into if
        await context.postMessage({ command: 'linkedNoteId', id: noteId });
      });
    }

    return {
      plugin: plugin,
    }
  }
}