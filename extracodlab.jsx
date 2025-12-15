import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { FilePlus, File, Trash2, Play, Eye, RotateCcw } from 'lucide-react';
import { TRACER_CODE } from '../logic/tracer';

// --- CONSTANTS ---
const STORAGE_KEY = 'python-lab-files-v1';
const DEFAULT_FILES = [
    { name: 'main.py', language: 'python', content: 'name = input("Enter name: ")\nprint(f"Hello {name}")\n\ntotal = 0\nfor i in range(3):\n    total = total + 10\n    x = i * 2\n    print(f"Step {i}: {total}")\n\nprint("Done!")' },
    { name: 'data.txt', language: 'plaintext', content: 'Score: 100' }
];

const PythonLab = () => {
  // --- STATE ---
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_FILES;
  });
  
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  
  // Resizable Panels State
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [terminalWidth, setTerminalWidth] = useState(400); // Pixels
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);

  // Visualizer State
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

  // --- AUTO-SAVE ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }, [files]);

  // --- RESIZE HANDLERS ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSidebar) {
        const newWidth = Math.max(150, Math.min(e.clientX, 400)); // Min 150, Max 400
        setSidebarWidth(newWidth);
      }
      if (isDraggingTerminal) {
        const newWidth = Math.max(200, Math.min(window.innerWidth - e.clientX, 800)); // Min 200, Max 800
        setTerminalWidth(newWidth);
        // Refit terminal during resize (optional, might be heavy)
        if (fitAddonRef.current) fitAddonRef.current.fit();
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingTerminal(false);
      // Ensure terminal fits perfectly after resize ends
      if (fitAddonRef.current) fitAddonRef.current.fit();
    };

    if (isDraggingSidebar || isDraggingTerminal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar, isDraggingTerminal]);


  // --- INITIALIZATION ---
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e', foreground: '#ffffff' },
      fontSize: 14,
      fontFamily: '"Cascadia Code", "Fira Mono", monospace'
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    if (terminalRef.current) {
        term.open(terminalRef.current);
    }
    
    setTimeout(() => { try { fitAddon.fit(); } catch (e) {} }, 100);

    term.writeln('\x1b[33mInitializing 9618 Lab...\x1b[0m');
    xtermRef.current = term;

    const loadPython = async () => {
      try {
        const pyodide = await window.loadPyodide();
        pyodideRef.current = pyodide;
        
        pyodide.setStdout({ batched: (msg) => term.writeln(msg) });
        pyodide.setStdin({
          stdin: () => {
            const result = prompt("Input required:");
            term.writeln(result);
            return result;
          }
        });

        setIsPyodideReady(true);
        term.writeln('\x1b[32m>>> System Ready.\x1b[0m');
        term.write('\r\n$ ');
      } catch (err) {
        term.writeln(`\x1b[31mError: ${err.message}\x1b[0m`);
      }
    };
    loadPython();

    const handleResize = () => { try { fitAddon.fit(); } catch (e) {} };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // --- HIGHLIGHTER ---
  useEffect(() => {
    if (!editorRef.current || !isVisualizerOpen || !traceData) return;

    const currentLine = traceData[currentStep]?.line;

    if (currentLine) {
       const oldDecorations = decorationsRef.current;
       const newDecorations = editorRef.current.deltaDecorations(oldDecorations, [
         {
           range: new window.monaco.Range(currentLine, 1, currentLine, 1),
           options: {
             isWholeLine: true,
             className: 'myLineDecoration',
             glyphMarginClassName: 'myGlyphMarginClass'
           }
         }
       ]);
       decorationsRef.current = newDecorations;
       editorRef.current.revealLineInCenter(currentLine);
    }
  }, [currentStep, isVisualizerOpen, traceData]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  // --- FILE OPS ---
  const handleEditorChange = (value) => {
    const updatedFiles = [...files];
    updatedFiles[activeFileIndex].content = value;
    setFiles(updatedFiles);
  };

  const createNewFile = () => {
    const fileName = prompt("Enter file name:");
    if (!fileName) return;
    const lang = fileName.endsWith('.py') ? 'python' : 'plaintext';
    setFiles([...files, { name: fileName, language: lang, content: '' }]);
    setActiveFileIndex(files.length);
  };

  const deleteFile = (e, index) => {
    e.stopPropagation();
    if (files.length === 1) return alert("Keep at least one file!");
    if (window.confirm(`Delete ${files[index].name}?`)) {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      setActiveFileIndex(0);
    }
  };

  const resetFiles = () => {
    if (window.confirm("Reset all files to default?")) {
        setFiles(DEFAULT_FILES);
        setActiveFileIndex(0);
    }
  };

  // --- RUN ---
  const runCode = async () => {
    if (!pyodideRef.current) return;
    setIsVisualizerOpen(false); 
    if (editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }

    const term = xtermRef.current;
    const pyodide = pyodideRef.current;

    term.writeln('\x1b[34m--- Running ---\x1b[0m');

    try {
      files.forEach(f => pyodide.FS.writeFile(f.name, f.content));
      const activeFile = files[activeFileIndex];
      
      if (activeFile.name.endsWith('.py')) {
         await pyodide.runPythonAsync(activeFile.content);
      } else {
         term.writeln(`\x1b[33mSwitch to a .py file to run!\x1b[0m`);
      }
    } catch (err) {
      term.writeln(`\x1b[31m${err}\x1b[0m`);
    }
    term.write('\r\n$ ');
  };

  // --- VISUALIZE ---
  const visualizeCode = async () => {
    if (!pyodideRef.current) return;
    const term = xtermRef.current;
    const pyodide = pyodideRef.current;
    
    term.writeln('\x1b[35m--- Generating Visualization... ---\x1b[0m');

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
            setIsVisualizerOpen(true);
            term.writeln(`\x1b[32m>>> Captured ${data.length} steps.\x1b[0m`);
            setTimeout(() => { try { fitAddonRef.current.fit(); } catch(e){} }, 50);
        } else {
            term.writeln(`\x1b[33mWarning: No steps captured.\x1b[0m`);
        }
      } else {
        term.writeln(`\x1b[31mError: Trace failed.\x1b[0m`);
      }

    } catch (err) {
      term.writeln(`\x1b[31mVisualization Error: ${err}\x1b[0m`);
    }
  };

  const currentTrace = traceData && traceData[currentStep] ? traceData[currentStep] : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e', color: '#ccc' }}>
      
      {/* CSS */}
      <style>{`
        .myLineDecoration { background: rgba(144, 238, 144, 0.2); border-left: 2px solid #4CAF50; }
        .myGlyphMarginClass { background: #4CAF50; width: 5px !important; }
        .resizer { width: 5px; background: #333; cursor: col-resize; transition: background 0.2s; z-index: 10; }
        .resizer:hover { background: #9C27B0; }
      `}</style>

      {/* NAVBAR */}
      <div style={{ height: '50px', backgroundColor: '#2d2d2d', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #444' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#ccc' }}>🏠</Link>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>Python Lab</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={runCode} disabled={!isPyodideReady} style={{ backgroundColor: isPyodideReady ? '#4CAF50' : '#555', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Play size={16} /> RUN
            </button>
            <button onClick={visualizeCode} disabled={!isPyodideReady} style={{ backgroundColor: isPyodideReady ? '#9C27B0' : '#555', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Eye size={16} /> VISUALIZE
            </button>
        </div>
      </div>

      {/* MAIN LAYOUT: RESIZABLE COLUMNS */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* LEFT: SIDEBAR */}
        <div style={{ width: sidebarWidth, backgroundColor: '#252526', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px', color: '#bbb', fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            EXPLORER 
            <div style={{ display: 'flex', gap: '10px'}}>
                <RotateCcw size={14} style={{ cursor: 'pointer' }} onClick={resetFiles} title="Reset" />
                <FilePlus size={16} style={{ cursor: 'pointer' }} onClick={createNewFile} title="New" />
            </div>
          </div>
          {files.map((file, index) => (
            <div 
              key={index}
              onClick={() => setActiveFileIndex(index)}
              style={{ 
                padding: '8px 15px', 
                cursor: 'pointer', 
                backgroundColor: activeFileIndex === index ? '#37373d' : 'transparent',
                color: activeFileIndex === index ? '#fff' : '#aaa',
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><File size={14} /> {file.name}</div>
              <Trash2 size={14} style={{ opacity: 0.5 }} onClick={(e) => deleteFile(e, index)} />
            </div>
          ))}
        </div>

        {/* RESIZER 1 (Left) */}
        <div className="resizer" onMouseDown={() => setIsDraggingSidebar(true)} />

        {/* CENTER: EDITOR + VISUALIZER */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#1e1e1e', padding: '5px 20px', color: '#fff', fontSize: '13px', borderBottom: '1px solid #333', flexShrink: 0 }}>
                {files[activeFileIndex].name}
            </div>
            
            <div style={{ 
                flexGrow: 1, 
                flexBasis: isVisualizerOpen ? '50%' : '100%', 
                minHeight: '0' 
            }}>
                <Editor
                    height="100%"
                    language={files[activeFileIndex].language}
                    theme="vs-dark"
                    value={files[activeFileIndex].content}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
            </div>
            
            {/* VISUALIZER PANEL */}
            {isVisualizerOpen && currentTrace && (
                <div style={{ height: '50%', flexShrink: 0, backgroundColor: '#2d2d2d', borderTop: '2px solid #9C27B0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px', display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #444', backgroundColor: '#252526' }}>
                        <span style={{ fontWeight: 'bold', color: '#E1BEE7' }}>Step {currentStep + 1} / {traceData.length}</span>
                        <input type="range" min="0" max={traceData.length - 1} value={currentStep} onChange={(e) => setCurrentStep(parseInt(e.target.value))} style={{ flex: 1 }} />
                        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} style={{cursor:'pointer'}}>Prev</button>
                        <button onClick={() => setCurrentStep(Math.min(traceData.length - 1, currentStep + 1))} style={{cursor:'pointer'}}>Next</button>
                        <button onClick={() => setIsVisualizerOpen(false)} style={{ color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer'}}>✖ Close</button>
                    </div>

                    <div style={{ display: 'flex', flex: 1, padding: '10px', gap: '20px', overflow: 'auto' }}>
                        <div style={{ minWidth: '150px' }}>
                            <div style={{ fontSize: '12px', color: '#888' }}>CURRENT LOCATION</div>
                            <div style={{ color: '#fff', fontWeight: 'bold' }}>Line {currentTrace.line}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>VARIABLES</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {Object.entries(currentTrace.variables).map(([key, val]) => (
                                    <div key={key} style={{ padding: '8px', backgroundColor: '#333', borderRadius: '4px', border: '1px solid #555' }}>
                                        <span style={{ color: '#64B5F6', fontWeight: 'bold' }}>{key}</span>
                                        <span style={{ color: '#aaa', margin: '0 5px' }}>=</span>
                                        <span style={{ color: '#81C784' }}>{val}</span>
                                    </div>
                                ))}
                                {Object.keys(currentTrace.variables).length === 0 && <span style={{color: '#666'}}>No variables yet...</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* RESIZER 2 (Right) */}
        <div className="resizer" onMouseDown={() => setIsDraggingTerminal(true)} />

        {/* RIGHT: TERMINAL */}
        <div style={{ width: terminalWidth, backgroundColor: '#000', borderLeft: '1px solid #333', padding: '10px' }}>
          <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
        </div>
        
      </div>
    </div>
  );
};

export default PythonLab;