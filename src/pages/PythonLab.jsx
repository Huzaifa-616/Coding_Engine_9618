import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import localforage from 'localforage';
import { 
  FilePlus, File, Trash2, Play, Eye, RotateCcw, AlignLeft, CheckCircle, 
  XCircle, Code2, TerminalSquare, ChevronRight, X, Maximize2, Minimize2, Eraser 
} from 'lucide-react';
import { TRACER_CODE } from '../logic/tracer';

const STORAGE_KEY = 'nexus-python-workspace-v1';
const DEFAULT_FILES = [
    { name: 'main.py', language: 'python', content: 'def calculate_score(points):\n    """\n    Calculates the final score.\n    """\n    total = points * 10\n    return total\n\nname = input("Enter name: ")\nprint(f"Hello {name}")\n\nfor i in range(3):\n    print(f"Step {i}: {calculate_score(i)}")\n\nprint("Done!")' },
    { name: 'data.txt', language: 'plaintext', content: 'Score: 100' }
];

const PythonLab = () => {
  const monaco = useMonaco();
  
  // --- ASYNC STATE (IndexedDB via localforage) ---
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [syntaxStatus, setSyntaxStatus] = useState('checking'); 
  
  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);

  // Refs
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const pyodideRef = useRef(null);
  const fitAddonRef = useRef(null);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  const lintTimeoutRef = useRef(null);

  // --- 1. LOAD STORAGE ---
  useEffect(() => {
    localforage.getItem(STORAGE_KEY).then(savedFiles => {
      if (savedFiles && savedFiles.length > 0) {
        setFiles(savedFiles);
      }
      setIsLoaded(true);
    }).catch(err => {
      console.error("Storage read failed:", err);
      setIsLoaded(true);
    });
  }, []);

  // --- 2. SAVE STORAGE ---
  useEffect(() => {
    if (isLoaded) {
      localforage.setItem(STORAGE_KEY, files).catch(err => console.error("Storage write failed:", err));
    }
  }, [files, isLoaded]);

  // --- INITIALIZATION & TERMINAL ---
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#0f172a', foreground: '#f8fafc', selectionBackground: '#334155', cursor: '#3b82f6' },
      fontSize: 14,
      fontFamily: '"Fira Code", "Cascadia Code", monospace',
      padding: 10
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    if (terminalRef.current) term.open(terminalRef.current);
    setTimeout(() => { try { fitAddon.fit(); } catch (e) {} }, 100);

    term.writeln('\x1b[38;2;59;130;246m[Nexus Engine]\x1b[0m Initializing Python 3.10 WebAssembly Core...');
    xtermRef.current = term;

    const loadPython = async () => {
      try {
        const pyodide = await window.loadPyodide();
        pyodideRef.current = pyodide;
        
        pyodide.setStdout({ batched: (msg) => term.writeln(msg) });
        pyodide.setStdin({
          stdin: () => {
            const result = prompt("Nexus IDE: The running script is requesting input:");
            term.writeln(`\x1b[38;2;148;163;184m> ${result}\x1b[0m`);
            return result;
          }
        });

        setIsPyodideReady(true);
        setSyntaxStatus('ok');
        term.writeln('\x1b[38;2;34;197;94m[Nexus Engine]\x1b[0m System Ready. Awaiting commands.\r\n');
        
        if (isLoaded) runLinter(files[activeFileIndex].content);
      } catch (err) {
        term.writeln(`\x1b[31mBoot Error: ${err.message}\x1b[0m`);
        setSyntaxStatus('error');
      }
    };
    loadPython();

    const handleResize = () => { try { fitAddon.fit(); } catch (e) {} };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); term.dispose(); };
  }, [isLoaded]); // Depend on isLoaded so files[activeFileIndex] is accurate

  // --- LINTING & FORMATTING ---
  const runLinter = async (codeValue) => {
    if (!pyodideRef.current || !monaco || !editorRef.current || codeValue.trim() === '') return;
    const pyodide = pyodideRef.current;
    const model = editorRef.current.getModel();
    
    const lintScript = `
import ast, json
try:
    ast.parse(${JSON.stringify(codeValue)})
    "OK"
except SyntaxError as e:
    json.dumps({"line": e.lineno, "col": e.offset, "msg": e.msg})
    `;

    try {
        const res = await pyodide.runPythonAsync(lintScript);
        if (res === "OK") {
            monaco.editor.setModelMarkers(model, "python", []);
            setSyntaxStatus('ok');
        } else {
            const err = JSON.parse(res);
            monaco.editor.setModelMarkers(model, "python", [{
                startLineNumber: err.line, startColumn: err.col || 1, endLineNumber: err.line, endColumn: 100,
                message: err.msg, severity: monaco.MarkerSeverity.Error
            }]);
            setSyntaxStatus('error');
        }
    } catch(e) {}
  };

  const handleEditorChange = (value) => {
    const updatedFiles = [...files];
    updatedFiles[activeFileIndex].content = value;
    setFiles(updatedFiles);

    setSyntaxStatus('checking');
    if (lintTimeoutRef.current) clearTimeout(lintTimeoutRef.current);
    lintTimeoutRef.current = setTimeout(() => {
        if (updatedFiles[activeFileIndex].language === 'python') runLinter(value);
        else setSyntaxStatus('ok');
    }, 600);
  };

  const formatCode = async () => {
    if (!pyodideRef.current || files[activeFileIndex].language !== 'python') return;
    const pyodide = pyodideRef.current;
    const formatScript = `
import ast
try:
    ast.unparse(ast.parse(${JSON.stringify(files[activeFileIndex].content)}))
except:
    "ERROR"
    `;

    try {
        const formatted = await pyodide.runPythonAsync(formatScript);
        if (formatted !== "ERROR") handleEditorChange(formatted);
        else alert("Cannot format: Fix syntax errors first.");
    } catch(e) {}
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  // --- VISUALIZER HOOKS ---
  useEffect(() => {
    if (!editorRef.current || !isVisualizerOpen || !traceData) return;
    const currentLine = traceData[currentStep]?.line;
    if (currentLine) {
       decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
         { range: new window.monaco.Range(currentLine, 1, currentLine, 1), options: { isWholeLine: true, className: 'visualizer-line-highlight', glyphMarginClassName: 'visualizer-glyph' } }
       ]);
       editorRef.current.revealLineInCenter(currentLine);
    }
  }, [currentStep, isVisualizerOpen, traceData]);

  // --- FILE OPERATIONS ---
  const createNewFile = () => {
    const fileName = prompt("Enter file name (e.g., script.py):");
    if (!fileName) return;
    const lang = fileName.endsWith('.py') ? 'python' : 'plaintext';
    setFiles([...files, { name: fileName, language: lang, content: '' }]);
    setActiveFileIndex(files.length);
  };

  const deleteFile = (e, index) => {
    e.stopPropagation();
    if (files.length === 1) return alert("Keep at least one file!");
    if (window.confirm(`Delete ${files[index].name}?`)) {
      setFiles(files.filter((_, i) => i !== index));
      setActiveFileIndex(0);
    }
  };

  const resetFiles = () => {
    if (window.confirm("Reset all files to default? You will lose your changes.")) {
        setFiles(DEFAULT_FILES);
        setActiveFileIndex(0);
        setTimeout(() => runLinter(DEFAULT_FILES[0].content), 500);
    }
  };

  const clearTerminal = () => {
    if (xtermRef.current) {
        xtermRef.current.clear();
        xtermRef.current.writeln('\x1b[38;2;59;130;246m[Nexus Engine]\x1b[0m Terminal cleared. Ready.');
    }
  };

  // --- EXECUTION ---
  const runCode = async () => {
    if (!pyodideRef.current) return;
    setIsVisualizerOpen(false); 
    if (editorRef.current) decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);

    const term = xtermRef.current;
    const pyodide = pyodideRef.current;

    term.writeln('\r\n\x1b[44m\x1b[37m RUNNING SCRIPT \x1b[0m');

    try {
      files.forEach(f => pyodide.FS.writeFile(f.name, f.content));
      const activeFile = files[activeFileIndex];
      
      if (activeFile.name.endsWith('.py')) {
         await pyodide.runPythonAsync(activeFile.content);
         term.writeln('\x1b[38;2;34;197;94mProcess finished with exit code 0\x1b[0m');
      } else {
         term.writeln(`\x1b[38;2;234;179;8mWarning: Select a .py file to execute.\x1b[0m`);
      }
    } catch (err) {
      term.writeln(`\x1b[31m${err}\x1b[0m`);
    }
  };

  const visualizeCode = async () => {
    if (!pyodideRef.current) return;
    const term = xtermRef.current;
    const pyodide = pyodideRef.current;
    
    term.writeln('\r\n\x1b[45m\x1b[37m GENERATING VISUALIZATION \x1b[0m');

    try {
      files.forEach(f => pyodide.FS.writeFile(f.name, f.content));
      const activeFile = files[activeFileIndex];

      await pyodide.runPythonAsync(TRACER_CODE);

      const wrappedCode = `
try:
    start_trace()
    code = open("${activeFile.name}").read()
    exec(compile(code, "${activeFile.name}", "exec"))
finally:
    stop_trace()
      `;

      let capturedOutput = [];
      let isCapturingTrace = false;

      pyodide.setStdout({
        batched: (msg) => {
          if (msg.includes("---TRACE_START---")) { isCapturingTrace = true; return; }
          if (msg.includes("---TRACE_END---")) { isCapturingTrace = false; return; }
          if (isCapturingTrace) { capturedOutput.push(msg); } 
          else { term.writeln(msg); }
        }
      });

      await pyodide.runPythonAsync(wrappedCode);
      pyodide.setStdout({ batched: (msg) => term.writeln(msg) });

      const fullLog = capturedOutput.join("");
      const jsonStart = fullLog.indexOf("[");
      const jsonEnd = fullLog.lastIndexOf("]");
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = fullLog.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        
        if (data.length > 0) {
            setTraceData(data);
            setCurrentStep(0);
            setIsFullscreen(false); // Force close fullscreen so they can see the visualizer
            setIsVisualizerOpen(true);
            term.writeln(`\x1b[38;2;34;197;94mSuccessfully captured ${data.length} execution steps.\x1b[0m`);
            setTimeout(() => { try { fitAddonRef.current.fit(); } catch(e){} }, 50);
        } else {
            term.writeln(`\x1b[38;2;234;179;8mWarning: No steps captured.\x1b[0m`);
        }
      } else {
        term.writeln(`\x1b[31mError: Trace failed.\x1b[0m`);
      }

    } catch (err) {
      term.writeln(`\x1b[31mVisualization Error: ${err}\x1b[0m`);
    }
  };

  const currentTrace = traceData && traceData[currentStep] ? traceData[currentStep] : null;

  if (!isLoaded) return <div style={{ height: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Booting Workspace...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: '#cbd5e1', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      <style>{`
        .visualizer-line-highlight { background: rgba(139, 92, 246, 0.2); border-left: 3px solid #8b5cf6; }
        .visualizer-glyph { background: #8b5cf6; width: 6px !important; border-radius: 3px; margin-left: 2px;}
        .xterm .xterm-viewport::-webkit-scrollbar { width: 8px; }
        .xterm .xterm-viewport::-webkit-scrollbar-track { background: transparent; }
        .xterm .xterm-viewport::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

      {/* --- TOP RIBBON --- */}
      <div style={{ height: '56px', backgroundColor: '#020617', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>
                <Code2 size={20}/>
            </Link>
            <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '15px', letterSpacing: '0.02em' }}>Python IDE</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: '100px', backgroundColor: '#1e293b', fontSize: '11px', fontWeight: '600' }}>
                {syntaxStatus === 'checking' && <><RotateCcw size={12} className="animate-spin" color="#94a3b8"/> Checking...</>}
                {syntaxStatus === 'ok' && <><CheckCircle size={12} color="#22c55e"/> Syntax OK</>}
                {syntaxStatus === 'error' && <><XCircle size={12} color="#ef4444"/> Syntax Error</>}
            </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={formatCode} disabled={!isPyodideReady} style={{ backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', transition: 'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#475569'; e.currentTarget.style.background='#334155'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#334155'; e.currentTarget.style.background='#1e293b'}}>
                <AlignLeft size={16} /> Format
            </button>
            <button onClick={runCode} disabled={!isPyodideReady} style={{ backgroundColor: isPyodideReady ? '#2563eb' : '#1e293b', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', boxShadow: isPyodideReady ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none' }}>
                <Play size={16} fill="currentColor" /> Run Code
            </button>
            <button onClick={visualizeCode} disabled={!isPyodideReady} style={{ backgroundColor: isPyodideReady ? '#7c3aed' : '#1e293b', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', boxShadow: isPyodideReady ? '0 4px 12px rgba(124, 58, 237, 0.3)' : 'none' }}>
                <Eye size={16} /> Visualize
            </button>
        </div>
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        {!isFullscreen && (
          <div style={{ width: '240px', backgroundColor: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', color: '#64748b', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Explorer 
              <div style={{ display: 'flex', gap: '12px'}}>
                  <RotateCcw size={14} style={{ cursor: 'pointer' }} onClick={resetFiles} title="Reset to Defaults" />
                  <FilePlus size={14} style={{ cursor: 'pointer' }} onClick={createNewFile} title="New File" />
              </div>
            </div>
            
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {files.map((file, index) => (
                <div 
                  key={index}
                  onClick={() => { setActiveFileIndex(index); runLinter(files[index].content); }}
                  style={{ 
                    padding: '8px 12px', cursor: 'pointer', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px',
                    backgroundColor: activeFileIndex === index ? '#1e293b' : 'transparent',
                    color: activeFileIndex === index ? '#f8fafc' : '#94a3b8',
                    fontWeight: activeFileIndex === index ? '600' : '400'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <File size={14} color={file.name.endsWith('.py') ? '#3b82f6' : '#94a3b8'}/> 
                    {file.name}
                  </div>
                  {files.length > 1 && <Trash2 size={14} style={{ color: '#ef4444', opacity: activeFileIndex === index ? 1 : 0.4 }} onClick={(e) => deleteFile(e, index)} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CENTER COLUMN (Editor + Terminal) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            
            {/* Editor Breadcrumbs & Fullscreen Toggle */}
            <div style={{ backgroundColor: '#0f172a', padding: '10px 20px', color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#3b82f6' }}>src</span> <ChevronRight size={14}/> <span style={{ color: '#f8fafc' }}>{files[activeFileIndex].name}</span>
                </div>
                <button onClick={() => { setIsFullscreen(!isFullscreen); setTimeout(() => fitAddonRef.current?.fit(), 100); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Toggle Fullscreen">
                  {isFullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                </button>
            </div>
            
            {/* THE MONACO EDITOR */}
            <div style={{ flex: 1, position: 'relative' }}>
                <Editor
                    height="100%"
                    language={files[activeFileIndex].language}
                    theme="vs-dark"
                    value={files[activeFileIndex].content}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{ 
                        minimap: { enabled: true, scale: 0.75, renderCharacters: false }, 
                        fontSize: 15, fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontLigatures: true, formatOnPaste: true, formatOnType: true, suggestOnTriggerCharacters: true, wordWrap: "on", smoothScrolling: true, cursorSmoothCaretAnimation: "on", cursorBlinking: "smooth", padding: { top: 16 }, scrollBeyondLastLine: false
                    }}
                />
            </div>

            {/* THE TERMINAL PANEL */}
            <div style={{ height: isFullscreen ? '0%' : '30%', minHeight: isFullscreen ? '0' : '200px', display: isFullscreen ? 'none' : 'flex', backgroundColor: '#020617', borderTop: '1px solid #1e293b', flexDirection: 'column' }}>
                <div style={{ padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
                    <div style={{ color: '#f8fafc', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #3b82f6', paddingBottom: '8px', marginBottom: '-9px', display: 'flex', alignItems: 'center', gap: 6 }}>
                       <TerminalSquare size={14}/> Terminal
                    </div>
                    <button onClick={clearTerminal} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: '600' }} title="Clear Terminal">
                      <Eraser size={14}/> Clear
                    </button>
                </div>
                <div style={{ flex: 1, padding: '10px 10px 10px 20px' }}>
                    <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>

        </div>

        {/* RIGHT COLUMN (Visualizer Panel) */}
        {isVisualizerOpen && currentTrace && !isFullscreen && (
            <div style={{ width: '380px', backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease' }}>
                
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', backgroundColor: '#020617' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc', fontWeight: '600' }}>
                        <Eye size={16} color="#8b5cf6"/> Memory Visualizer
                    </div>
                    <button onClick={() => setIsVisualizerOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
                </div>

                <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: '700' }}>STEP {currentStep + 1} OF {traceData.length}</span>
                        <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Line {currentTrace.line}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} style={{ padding: '6px 12px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Prev</button>
                        <input type="range" min="0" max={traceData.length - 1} value={currentStep} onChange={(e) => setCurrentStep(parseInt(e.target.value))} style={{ flex: 1, accentColor: '#8b5cf6' }} />
                        <button onClick={() => setCurrentStep(Math.min(traceData.length - 1, currentStep + 1))} style={{ padding: '6px 12px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Next</button>
                    </div>
                </div>

                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '16px' }}>LOCAL VARIABLES</div>
                    {Object.keys(currentTrace.variables).length === 0 ? (
                        <div style={{ padding: '16px', border: '1px dashed #334155', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No variables in memory.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {Object.entries(currentTrace.variables).map(([key, val]) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                                    <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '14px', fontWeight: '600' }}>{key}</span>
                                    <span style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: '14px' }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        )}
        
      </div>
    </div>
  );
};

export default PythonLab;