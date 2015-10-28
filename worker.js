var window = this;
var console = {};

window.is_worker = true;

function SEND(type) {
    var msg = {
        type:    type,
        content: Array.prototype.slice.call(arguments).slice(1)
    };
    postMessage(JSON.stringify(msg));
}

console.log = function() {
    SEND("echo", Array.prototype.slice.call(arguments).join(" "));
};

console.error = function() {
    SEND("error", Array.prototype.slice.call(arguments).join(" "));
};

window._events = {};
window.on = function(k, f) {
    window._events[k] = f;
};

this.onmessage = function (e) {
    var msg = JSON.parse(e.data);
    switch (msg.type) {
    case "log":
        console.log(msg.content);
        return;
    case "close":
        window.device.close();
        return;
    }
    if (window._events[msg.type]) {
        window._events[msg.type].apply(null, msg.content);
    }
};

// Webruby

var Module = window.Module = {
    print:    console.log,
    printErr: console.error
};

importScripts("webruby-location/webruby.js");
window.webruby = new window.WEBRUBY();

// Event listeners

window.on("run_source", function(source) {
    webruby.run_source(source);
});

window.on("run_bytecode", function(bytecode) {
    webruby.run_bytecode(bytecode.split(","));
});

window.on("mruby_compile", function(code) {
    var file_name = "temp.mrb";

    window.webruby.compile_to_file(code, file_name);

    var bytecode = window.FS.readFile(file_name);

    var bytecode_str = bytecode.join(",");

    SEND("mruby_compile", bytecode_str, code, file_name);
});

SEND("READY");
