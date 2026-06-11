import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { FilePlus, File, Trash2, Play, Eye } from 'lucide-react';
import { Lexer, Parser, Interpreter } from '../logic/pseudoEngine';

const STORAGE_KEY = 'pseudo-lab-files-v1';
const DEFAULT_CODE = `// Cambridge 9618 Pseudocode Demo

DECLARE Name : STRING
DECLARE i : INTEGER

OUTPUT "What is your name?"
INPUT Name

OUTPUT "Hello " & Name & "!"

FOR i <- 1 TO 3
    OUTPUT "Count: " & NUM_TO_STR(i)
NEXT i

OUTPUT "Done!"
`;

const PseudoLab = () => {
  // --- STATE ---
  const [code, setCode] = useState(() => {
    return localStorage.getItem('pseudo-code-v1') || DEFAULT_CODE;
  });

  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { "data.txt": "10\n20\n30" };
  });

  const [activeFileName, setActiveFileName] = useState("script.psc"); 
  const [isRunning, setIsRunning] = useState(false);
  
  // Visualizer State
  const [traceData, setTraceData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  
  // Refs
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const interpreterRef = useRef(null);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('pseudo-code-v1', code); }, [code]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(files)); }, [files]);

  // --- TERMINAL SETUP ---
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

    term.writeln('\x1b[33mInitializing Pseudocode Engine...\x1b[0m');
    term.write('\r\n$ ');
    xtermRef.current = term;

    const handleResize = () => { try { fitAddon.fit(); } catch (e) {} };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // --- HIGHLIGHTER (Visualizer) ---
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

  // --- ENGINE LOGIC ---
  const executeCode = async (mode = 'run') => {
    if (isRunning) return;
    setIsRunning(true);
    
    // Reset Visualizer if running normally
    if (mode === 'run') {
        setIsVisualizerOpen(false);
        if (editorRef.current) {
            decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
        }
    }

    const term = xtermRef.current;
    if (mode === 'run') term.writeln('\x1b[34m--- Running ---\x1b[0m');
    else term.writeln('\x1b[35m--- Generating Visualization... ---\x1b[0m');

    let recordedSteps = [];

    try {
        const lexer = new Lexer(code);
        const parser = new Parser(lexer.tokenize());
        const ast = parser.parse();

        const interpreter = new Interpreter(
            // Output Callback
            (msg) => {
                if(msg.type === 'error') term.writeln(`\x1b[31m${msg.text}\x1b[0m`);
                else term.writeln(msg.text);
            },
            // Input Callback
            (varName) => new Promise((resolve) => {
                term.write(`\r\nInput for ${varName}: `);
                let buffer = "";
                const disposable = term.onData(e => {
                    if (e === '\r') { 
                        term.writeln('');
                        disposable.dispose();
                        resolve(buffer);
                    } else if (e === '\u007F') { 
                        if (buffer.length > 0) {
                            buffer = buffer.substr(0, buffer.length - 1);
                            term.write('\b \b');
                        }
                    } else {
                        buffer += e;
                        term.write(e);
                    }
                });
            }),
            files,
            setFiles,
            // STEPPER CALLBACK (The Magic Part)
            async (line, vars) => {
                if (mode === 'visualize' && line > 0) {
                    // Deep copy variables to create a snapshot
                    const snapshot = {};
                    for (const [key, valObj] of Object.entries(vars)) {
                        snapshot[key] = valObj.value; // Simplify { type: 'INT', value: 10 } to just 10
                    }
                    recordedSteps.push({ line, variables: snapshot });
                }
            }
        );

        interpreterRef.current = interpreter;
        await interpreter.execute(ast);
        
        if (mode === 'run') {
            term.writeln('\x1b[32m\n--- Program Finished ---\x1b[0m');
        } else {
            // Visualization Mode Finished
            if (recordedSteps.length > 0) {
                setTraceData(recordedSteps);
                setCurrentStep(0);
                setIsVisualizerOpen(true);
                term.writeln(`\x1b[32m>>> Captured ${recordedSteps.length} steps.\x1b[0m`);
            } else {
                term.writeln(`\x1b[33mWarning: No steps captured.\x1b[0m`);
            }
        }

    } catch (e) {
        term.writeln(`\x1b[31mError: ${e.message}\x1b[0m`);
    } finally {
        setIsRunning(false);
        term.write('\r\n$ ');
    }
  };

  // --- UI ACTIONS ---
  const createNewFile = () => {
    const fileName = prompt("Enter file name (e.g. data.txt):");
    if (!fileName) return;
    setFiles({...files, [fileName]: ""});
  };

  const deleteFile = (e, name) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${name}?`)) {
        const newFiles = {...files};
        delete newFiles[name];
        setFiles(newFiles);
        if (activeFileName === name) setActiveFileName("script.psc");
    }
  };

  const currentTrace = traceData && traceData[currentStep] ? traceData[currentStep] : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e', color: '#ccc' }}>
      
      {/* CSS Styles */}
      <style>{`
        .myLineDecoration { background: rgba(144, 238, 144, 0.2); border-left: 2px solid #4CAF50; }
        .myGlyphMarginClass { background: #4CAF50; width: 5px !important; }
      `}</style>

      {/* NAVBAR */}
      <div style={{ height: '50px', backgroundColor: '#2d2d2d', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #444' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#ccc' }}>🏠</Link>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>Pseudocode Lab</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => executeCode('run')} disabled={isRunning} style={{ backgroundColor: isRunning ? '#555' : '#4CAF50', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Play size={16} /> RUN
            </button>
            <button onClick={() => executeCode('visualize')} disabled={isRunning} style={{ backgroundColor: isRunning ? '#555' : '#9C27B0', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Eye size={16} /> VISUALIZE
            </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div style={{ width: '200px', backgroundColor: '#252526', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px', color: '#bbb', fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            EXPLORER <FilePlus size={16} style={{ cursor: 'pointer' }} onClick={createNewFile} />
          </div>
          
          <div onClick={() => setActiveFileName("script.psc")} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: activeFileName === "script.psc" ? '#37373d' : 'transparent', color: activeFileName === "script.psc" ? '#fff' : '#aaa', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📝 script.psc</div>
          </div>

          {Object.keys(files).map((name) => (
            <div key={name} onClick={() => setActiveFileName(name)} style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: activeFileName === name ? '#37373d' : 'transparent', color: activeFileName === name ? '#fff' : '#aaa', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><File size={14} /> {name}</div>
              <Trash2 size={14} style={{ opacity: 0.5 }} onClick={(e) => deleteFile(e, name)} />
            </div>
          ))}
        </div>

        {/* EDITOR COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#1e1e1e', padding: '5px 20px', color: '#fff', fontSize: '13px', borderBottom: '1px solid #333' }}>
                {activeFileName}
            </div>
            
            <div style={{ flexGrow: 1, flexBasis: isVisualizerOpen ? '50%' : '100%', minHeight: '0' }}>
                {activeFileName === "script.psc" ? (
                    <Editor
                        height="100%"
                        language="vb"
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val)}
                        onMount={handleEditorDidMount}
                        options={{ minimap: { enabled: false }, fontSize: 14 }}
                    />
                ) : (
                    <textarea 
                        style={{ width: '100%', height: '100%', backgroundColor: '#1e1e1e', color: '#ccc', border: 'none', padding: '20px', outline: 'none', fontFamily: 'monospace', resize: 'none' }}
                        value={files[activeFileName]}
                        onChange={(e) => setFiles({...files, [activeFileName]: e.target.value})}
                    />
                )}
            </div>

            {/* VISUALIZER PANEL */}
            {isVisualizerOpen && currentTrace && (
                <div style={{ height: '50%', flexShrink: 0, backgroundColor: '#2d2d2d', borderTop: '2px solid #9C27B0', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Controls */}
                    <div style={{ padding: '10px', display: 'flex', gap: '15px', alignItems: 'center', borderBottom: '1px solid #444', backgroundColor: '#252526' }}>
                        <span style={{ fontWeight: 'bold', color: '#E1BEE7' }}>Step {currentStep + 1} / {traceData.length}</span>
                        <input 
                            type="range" 
                            min="0" 
                            max={traceData.length - 1} 
                            value={currentStep} 
                            onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} style={{cursor:'pointer'}}>Prev</button>
                        <button onClick={() => setCurrentStep(Math.min(traceData.length - 1, currentStep + 1))} style={{cursor:'pointer'}}>Next</button>
                        <button onClick={() => setIsVisualizerOpen(false)} style={{ color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer'}}>✖ Close</button>
                    </div>

                    {/* Variable View */}
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
                                        <span style={{ color: '#81C784' }}>{JSON.stringify(val)}</span>
                                    </div>
                                ))}
                                {Object.keys(currentTrace.variables).length === 0 && <span style={{color: '#666'}}>No variables yet...</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* TERMINAL */}
        <div style={{ width: '35%', padding: '10px', backgroundColor: '#000', borderLeft: '1px solid #333' }}>
          <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
        </div>
        
      </div>
    </div>
  );
};

export default PseudoLab;