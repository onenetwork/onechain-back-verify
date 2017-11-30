function isObject(object) {
    return object && Object.prototype.toString.call(object) === '[object Object]';
}

function isArray(object) {
    return object && Object.prototype.toString.call(object) === '[object Array]';
}

function isDate(object) {
    return object && Object.prototype.toString.call(object) === '[object Date]';
}

exports.common = function(obj1, obj2) {

    var resultObj;

    if (isObject(obj1) && isObject(obj2)) {
        resultObj = {};
        for (var key in obj1) {
            if (obj2.hasOwnProperty(key)) {
                var res = this.common(obj1[key], obj2[key]);
                if (res.success) {
                    resultObj[key] = res.value;
                }
            }
        }
        return {
            success: true,
            value: resultObj
        };
    }

    if (isArray(obj1) && isArray(obj2)) {
        resultObj = [];
        for (var i = 0; i < obj1.length; ++i) {
            for (var j = 0; i < obj2.length; ++j) {
                var res = this.common(obj1[i], obj2[j]);
                if (res.success) {
                    resultObj[i] = res.value;
                }
            }
        }
        return {
            success: true,
            value: resultObj
        };
    }

    if (isDate(obj1) && isDate(obj2)) {
        if (obj1.getTime() === obj2.getTime()) {
            return {
                success: true,
                value: obj1
            };
        }
    }

    if (obj1 === obj2) {
        return {
            success: true,
            value: obj1
        };
    }

    return {
        success: false
    };
}

exports.diffUsingJS = function(base1, newtxt1, partnerEntName) {
    // get the baseText and newText values from the two textboxes, and split them into lines
    var base = difflib.stringAsLines(base1);
    var newtxt = difflib.stringAsLines(newtxt1);

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