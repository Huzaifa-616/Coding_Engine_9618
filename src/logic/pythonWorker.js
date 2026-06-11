importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide;
let inputInt32;
let inputBytes;

self.sendPrompt = (msg) => {
    self.postMessage({ type: 'STDOUT', msg: msg });
};

// Recursive File System Sync (Grabs files inside folders too)
function syncFS(py, dir = '.') {
    let res = [];
    try {
        const entries = py.FS.readdir(dir);
        entries.forEach(filename => {
            if (['.', '..', 'tmp', 'dev', 'proc', 'home', 'lib'].includes(filename)) return;
            const fullPath = dir === '.' ? filename : dir + '/' + filename;
            const stat = py.FS.stat(fullPath);
            if (py.FS.isDir(stat.mode)) {
                res = res.concat(syncFS(py, fullPath));
            } else {
                res.push({ name: fullPath, content: py.FS.readFile(fullPath, { encoding: 'utf8' }) });
            }
        });
    } catch(e) {}
    return res;
}

// Automatically builds the nested folder tree inside Python's memory
function writeFilesToFS(py, files) {
    files.forEach(f => {
        const parts = f.name.split('/');
        let current = '';
        for(let i=0; i<parts.length - 1; i++) {
            current += (current ? '/' : '') + parts[i];
            try { py.FS.mkdir(current); } catch(e){}
        }
        py.FS.writeFile(f.name, f.content);
    });
}

self.onmessage = async (e) => {
    const data = e.data;

    // --- 1. INITIALIZATION ---
    if (data.type === 'INIT') {
        try {
            if (data.sab) {
                inputInt32 = new Int32Array(data.sab);
                inputBytes = new Uint8Array(data.sab, 8); 
            }
            
            pyodide = await loadPyodide();
            pyodide.setStdout({ batched: (msg) => self.postMessage({ type: 'STDOUT', msg: msg + '\r\n' }) });
            
            await pyodide.runPythonAsync(`
import js
import builtins

_raw_input = builtins.input
def _custom_input(prompt=""):
    if prompt:
        js.sendPrompt(str(prompt))
    return _raw_input()
builtins.input = _custom_input
            `);
            
            pyodide.setStdin({
                stdin: () => {
                    if (!inputInt32) return "Error: Headers missing.\n";
                    self.postMessage({ type: 'NEED_INPUT' });
                    Atomics.wait(inputInt32, 0, 0); 
                    const length = inputInt32[1];
                    const text = new TextDecoder().decode(inputBytes.slice(0, length));
                    Atomics.store(inputInt32, 0, 0); 
                    return text + "\n";
                }
            });
            self.postMessage({ type: 'READY' });
        } catch (err) {
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    }

    // --- 2. EXECUTION ---
    if (data.type === 'RUN') {
        try {
            writeFilesToFS(pyodide, data.files);
            await pyodide.runPythonAsync(data.code);
            self.postMessage({ type: 'DONE', files: syncFS(pyodide) });
        } catch (err) {
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    }

    // --- 3. LINTING & FORMATTING ---
    if (data.type === 'LINT') {
        const lintScript = `import ast, json\ntry:\n    ast.parse(${JSON.stringify(data.code)})\n    "OK"\nexcept SyntaxError as e:\n    json.dumps({"line": e.lineno, "col": e.offset, "msg": e.msg})`;
        try {
            const res = await pyodide.runPythonAsync(lintScript);
            self.postMessage({ type: 'LINT_RESULT', result: res });
        } catch(e) {}
    }

    if (data.type === 'FORMAT') {
        const formatScript = `import ast\ntry:\n    ast.unparse(ast.parse(${JSON.stringify(data.code)}))\nexcept:\n    "ERROR"`;
        try {
            const res = await pyodide.runPythonAsync(formatScript);
            self.postMessage({ type: 'FORMAT_RESULT', result: res, fileId: data.fileId });
        } catch(e) {}
    }

    // --- 4. VISUALIZER ---
    if (data.type === 'VISUALIZE') {
        try {
            writeFilesToFS(pyodide, data.files);
            await pyodide.runPythonAsync(data.tracerCode);

            const activeFile = data.activeFilePath;
            const wrappedCode = `try:\n    start_trace()\n    exec(compile(open("${activeFile}").read(), "${activeFile}", "exec"))\nfinally:\n    stop_trace()`;
            
            let capturedOutput = [];
            let isCapturingTrace = false;

            pyodide.setStdout({
                batched: (msg) => {
                    if (msg.includes("---TRACE_START---")) { isCapturingTrace = true; return; }
                    if (msg.includes("---TRACE_END---")) { isCapturingTrace = false; return; }
                    if (isCapturingTrace) { capturedOutput.push(msg); } 
                    else { self.postMessage({ type: 'STDOUT', msg: msg + '\r\n' }); }
                }
            });

            await pyodide.runPythonAsync(wrappedCode);
            pyodide.setStdout({ batched: (msg) => self.postMessage({ type: 'STDOUT', msg: msg + '\r\n' }) });

            const fullLog = capturedOutput.join("");
            const jsonStart = fullLog.indexOf("[");
            const jsonEnd = fullLog.lastIndexOf("]");
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const traceData = JSON.parse(fullLog.substring(jsonStart, jsonEnd + 1));
                self.postMessage({ type: 'VISUALIZE_DONE', traceData, files: syncFS(pyodide) });
            } else {
                self.postMessage({ type: 'ERROR', error: 'Trace failed.' });
            }
        } catch (err) {
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    }
};