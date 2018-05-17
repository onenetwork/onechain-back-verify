exports.diffUsingJS = function(copyBase, copyNew, partnerEntName) {

    // get the baseText and newText values from the two textboxes, and split them into lines
    var base = difflib.stringAsLines(JSON.stringify(copyBase, null, "\t"));
    var newtxt = difflib.stringAsLines(JSON.stringify(copyNew, null, "\t"));

    // create a SequenceMatcher instance that diffs the two sets of lines
    var sm = new difflib.SequenceMatcher(base, newtxt);

    // get the opcodes from the SequenceMatcher instance
    // opcodes is a list of 3-tuples describing what changes should be made to the base text
    // in order to yield the new text
    var opcodes = sm.get_opcodes();
    var diffoutputdiv = document.getElementById("diffoutput");
    while (diffoutputdiv.firstChild) diffoutputdiv.removeChild(diffoutputdiv.firstChild);

    // build the diff view and add it to the current DOM
    diffoutputdiv.appendChild(diffview.buildView({
        baseTextLines: base,
        newTextLines: newtxt,
        opcodes: opcodes,
        // set the display titles for each resource
        baseTextName: "My View",
        newTextName: partnerEntName,
        viewType: 0
    }));
}

exports.showCommon = function(json) {
    $('#json-renderer').jsonViewer(json);
}