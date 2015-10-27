(function() {
    var web = window.web = {};
    var $;

    web.settings = {
        workers: false,
    };

    web.paths = {
        worker:   "worker.js",
        noworker: "noworker.js",
        code: {
            jquery:  "lib/jquery.js",
            iframe:  "iframe.js",
            webruby: "webruby-location/webruby.js"
        }
    };

    web.code = {
        jquery:  null,
        iframe:  null,
        webruby: null
    };

    function setup() {
        $ = window.$;
        // Ideally we would prefer to use some browser-specific
        // detections, but this works for a general analysis.
        web.settings.workers = window.Worker && confirm("Do you want to use workers?");
        if (web.settings.workers) {
            alert("You'll be using workers");
        } else {
            alert("You won't be using workers");
        }
        environment();
    }

    function environment() {
        if (web.settings.workers) {
            // TODO:
            useWorkers();
        } else {
            useIframe();
        }
    }

    function useWorkers() {
        console.log("Using workers");

        web.worker = new Worker(web.paths.worker);

        web.worker.onmessage = workerOnMessage;
        web.worker.onerror   = workerOnError;
        web.worker.send      = workerSendMessage;

        web.mruby_compile = function(code, callback) {
            web._mruby_compile_callback = callback;
            web.workerSendMessage("mruby_compile", code);
        };
    }

    function workerOnMessage(e) {
        var msg = JSON.parse(e.data);
        console.log("worker.onmessage", msg.type, msg.content);
        switch (msg.type) {
        case "alert":
            alert(msg.content);
            return;
        case "mruby_compile":
            web._mruby_compile_callback(msg.content[0], msg.content[1], msg.content[2]);
            return;
        case "READY":
            web.workerSendMessage("log", "WORKER IS READY");
            return;
        case "WAITFOR":
            var func = msg.content[0];
            var args = msg.content[1];
            // We need to call web._resp as a full path to make sure uglifyjs doesn't shrink it
            web._resp = {};
            web._resp.original_func = func;
            func = eval(func);
            args = args.map(function(e) {
                if (typeof e === "string" && e.indexOf("(function") === 0 && e.slice("-4") === "})()") {
                    return eval(e);
                } else {
                    return e;
                }
            });
            web._resp.return = func.apply(null, args);
            // --- DEVELOPMENT ---
            console.log("WAITFOR", func.toString(), args, web._resp.return);
            // --- DEVELOPMENT ---
            if (!web._resp.return) return;
            web.SEND("WAITFOR", JSON.stringify(web._resp));
            return;
        }
    }

    function workerOnError(e) {
        console.error(e);
    }

    function workerSendMessage(type, obj) {
        var msg = {
            type:    type,
            content: Array.prototype.slice.call(arguments).slice(1)
        };
        web.worker.postMessage(JSON.stringify(msg));
    }

    function useIframe() {
        console.log("Using Iframe");
        var code = "<html><head>";
        code += "<script>";
        code += "var web = window.top.web;";
        code += "</script>";
        code += "<script>"+web.code.jquery+"</script>";
        code += "<script>"+web.code.iframe+"</script>";
        code += "</head></html>";

        var iframe = document.createElement("iframe");
        window.document.body.appendChild(iframe);

        var doc = iframe.document || iframe.contentDocument || iframe.contentWindow.document;

        doc.open();
        doc.write(code);
        doc.close();
    }

    function downloadCodes(done) {
        var sI1 = setInterval(function() {
            for (var k in web.paths.code) if (!web.code[k]) return;
            clearInterval(sI1);
            if (done) done();
        }, 150);
        for (var k in web.paths.code) getCode(k);
    }

    function getCode(k) {
        console.log("GETCODE", k, web.paths.code[k]);
        if (web.code[k]) return;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                web.code[k] = xhr.responseText;
                console.log("Got", k);
            }
        };
        xhr.open("GET", web.paths.code[k], true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send();
    }

    function init() {
        console.log("Downloding dependencies...");
        downloadCodes(function() {
            console.log("Setting up...");
            setup();
        });
    }

    init();
})();
