// Notes:
// - Iframe is a way of isolating all the hedious emscripten global functions
//   within a controllable environment.
// - Don't retain functions obtained by mruby/webruby/emscripten after we reset
//   that environment, they use pointers that won't be available after.

(function() {
    var web = window.web;

    var webruby;

    window.Module = {
        print:    console.log.bind(console),
        printErr: console.error.bind(console)
    };

    web.verbose = function(bool) {
        webruby.set_print_level(bool ? 1 : 0);
    }

    web.run_source = function(source) {
        webruby.run_source(source);
    }

    web.run_bytecode = function(bytecode) {
        webruby.run_bytecode(bytecode);
    };

    web.mruby_compile = function(code, callback) {
        var file_name = "temp.mrb";

        webruby.compile_to_file(code, file_name);

        var bytecode = window.FS.readFile(file_name);

        callback(bytecode, code, file_name);
    };

    var head = document.getElementsByTagName("head")[0];

    var webruby_script  = document.createElement("script");
    console.log("webruby code size", web.code.webruby.length);
    webruby_script.text = web.code.webruby;

    head.appendChild(webruby_script);

    webruby = new window.WEBRUBY({ print_level: 0 });

    console.log("Iframe ready.");
})();
