import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import localforage from 'localforage';
import { 
  FilePlus, FolderPlus, Folder, FolderOpen, File, Trash2, Play, Eye, RotateCcw, AlignLeft, CheckCircle, 
  XCircle, Code2, TerminalSquare, ChevronRight, X, Maximize2, Minimize2, 
  Eraser, Command, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Upload, BookOpen
} from 'lucide-react';
import { TRACER_CODE } from '../logic/tracer';

const STORAGE_KEY = 'python-lab-files-v3';

// Default Workspace Items
const DEFAULT_ITEMS = [
    { id: '1', type: 'file', name: 'main.py', parentId: 'root', language: 'python', content: 'def calculate_score(points):\n    """\n    Calculates the final score.\n    """\n    total = points * 10\n    return total\n\nname = input("Enter name: ")\nprint(f"Hello {name}")\n\nfor i in range(3):\n    print(f"Step {i}: {calculate_score(i)}")\n\nprint("Done!")' },
    { id: '2', type: 'file', name: 'data.txt', parentId: 'root', language: 'plaintext', content: 'Score: 100' }
];

const PythonLab = () => {
  const monaco = useMonaco();
  
  // --- STATE ---
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [activeFileId, setActiveFileId] = useState('1');
  const [expandedFolders, setExpandedFolders] = useState({'root': true});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPyodideReady, setIsPyodideReady] = useState(false);
  const [syntaxStatus, setSyntaxStatus] = useState('checking'); 
  
  const [traceData, setTraceData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);

  // External Notes DB State (Just like PastPaper Explorer!)
  const [notesDb, setNotesDb] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState({});

  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(15);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [visualizerWidth, setVisualizerWidth] = useState(380);
  const [isDraggingVis, setIsDraggingVis] = useState(false);

  // Refs
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);
  const lintTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragVisRef = useRef({ x: 0, startW: 0 });
  const workerRef = useRef(null);
  const sabRef = useRef(null);
  const isWaitingInputRef = useRef(false);

  const getFullPath = (itemId, currentItems) => {
      const item = currentItems.find(i => i.id === itemId);
      if (!item) return '';
      if (item.parentId === 'root' || !item.parentId) return item.name;
      return getFullPath(item.parentId, currentItems) + '/' + item.name;
  };

  const activeItem = items.find(i => i.id === activeFileId);

  // --- 1. LOAD EXTERNAL NOTES DB (The App.jsx Method) ---
  useEffect(() => {
    fetch('/notes_db.json')
      .then(res => res.json())
      .then(data => setNotesDb(data))
      .catch(err => console.log('No notes DB generated yet. Add .py files to /public/notes/ and run your script.'));
  }, []);

  // --- 2. LOAD & MIGRATE STORAGE ---
  useEffect(() => {
    localforage.getItem(STORAGE_KEY).then(saved => {
      if (saved && saved.length > 0) {
          if (saved[0].type === undefined) {
              const migrated = saved.map((f, i) => ({
                  id: 'file-' + i + '-' + Date.now(),
                  type: 'file',
                  name: f.name,
                  parentId: 'root',
                  language: f.language || (f.name.endsWith('.py') ? 'python' : 'plaintext'),
                  content: f.content
              }));
              setItems(migrated);
              setActiveFileId(migrated[0]?.id);
          } else {
              setItems(saved);
              const firstFile = saved.find(i => i.type === 'file');
              if (firstFile) setActiveFileId(firstFile.id);
          }
      }
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (isLoaded) localforage.setItem(STORAGE_KEY, items);
  }, [items, isLoaded]);

  // --- SLIDER MECHANICS ---
  useEffect(() => {
    const handleMove = (e) => {
      if (isDraggingVis) {
        const deltaX = dragVisRef.current.x - e.clientX;
        setVisualizerWidth(Math.max(250, Math.min(dragVisRef.current.startW + deltaX, window.innerWidth * 0.6)));
      }
    };
    const handleUp = () => setIsDraggingVis(false);

    if (isDraggingVis) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDraggingVis]);

  useEffect(() => {
    if (!isDraggingVis && fitAddonRef.current) setTimeout(() => { try { fitAddonRef.current.fit(); } catch(e){} }, 50);
  }, [visualizerWidth, isDraggingVis, isVisualizerOpen, isTerminalCollapsed]);

  // --- INITIALIZATION & TERMINAL ---
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#0f172a', foreground: '#f8fafc', selectionBackground: '#334155', cursor: '#3b82f6' },
      fontSize: 14, fontFamily: '"Fira Code", "Cascadia Code", monospace', padding: 10, scrollback: 5000 
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    if (terminalRef.current) term.open(terminalRef.current);
    setTimeout(() => { try { fitAddon.fit(); } catch (e) {} }, 100);

    term.writeln('\x1b[38;2;59;130;246m[Nexus Engine]\x1b[0m Booting Isolated Environment...');
    xtermRef.current = term;

    try {
        sabRef.current = new SharedArrayBuffer(1024);
    } catch(e) {
        term.writeln('\x1b[31mCRITICAL ERROR: Security Headers missing.\x1b[0m');
        return;
    }

    const worker = new Worker(new URL('../logic/pythonWorker.js', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'READY') {
            setIsPyodideReady(true);
            setSyntaxStatus('ok');
            term.writeln('\x1b[38;2;34;197;94m[Nexus Engine]\x1b[0m System Ready. Awaiting commands.\r\n');
        } 
        else if (data.type === 'STDOUT') {
            term.write(data.msg.replace(/\n/g, '\r\n')); 
        } 
        else if (data.type === 'NEED_INPUT') {
            isWaitingInputRef.current = true;
        } 
        else if (data.type === 'DONE') {
            term.writeln('\r\n\x1b[38;2;34;197;94mProcess finished with exit code 0\x1b[0m');
            if (data.files) syncItemsFromWorker(data.files);
        } 
        else if (data.type === 'ERROR') {
            term.writeln(`\r\n\x1b[31mError: ${data.error}\x1b[0m`);
        } 
        else if (data.type === 'VISUALIZE_DONE') {
            setTraceData(data.traceData);
            setCurrentStep(0);
            setIsVisualizerOpen(true);
            term.writeln(`\r\n\x1b[38;2;34;197;94mSuccessfully captured ${data.traceData.length} execution steps.\x1b[0m`);
            if (data.files) syncItemsFromWorker(data.files);
        } 
        else if (data.type === 'LINT_RESULT') {
            if (!editorRef.current || !window.monaco) return;
            const model = editorRef.current.getModel();
            if (data.result === 'OK') {
                window.monaco.editor.setModelMarkers(model, "python", []);
                setSyntaxStatus('ok');
            } else {
                const err = JSON.parse(data.result);
                window.monaco.editor.setModelMarkers(model, "python", [{ startLineNumber: err.line, startColumn: err.col || 1, endLineNumber: err.line, endColumn: 100, message: err.msg, severity: window.monaco.MarkerSeverity.Error }]);
                setSyntaxStatus('error');
            }
        } 
        else if (data.type === 'FORMAT_RESULT') {
            if (data.result !== 'ERROR') {
                setItems(prev => prev.map(i => i.id === data.fileId ? { ...i, content: data.result } : i));
            } else {
                alert("Cannot format: Fix syntax errors first.");
            }
        }
    };

    worker.postMessage({ type: 'INIT', sab: sabRef.current });

    let inputBufferStr = "";
    term.onData((key) => {
        if (!isWaitingInputRef.current) return; 
        if (key === '\r') { 
            term.write('\r\n');
            const encodedText = new TextEncoder().encode(inputBufferStr);
            const inputInt32 = new Int32Array(sabRef.current);
            const inputBytes = new Uint8Array(sabRef.current, 8);
            inputBytes.set(encodedText);
            inputInt32[1] = encodedText.length; 
            inputInt32[0] = 1; 
            Atomics.notify(inputInt32, 0, 1);
            inputBufferStr = "";
            isWaitingInputRef.current = false;
        } else if (key === '\x7F') { 
            if (inputBufferStr.length > 0) {
                inputBufferStr = inputBufferStr.slice(0, -1);
                term.write('\b \b');
            }
        } else {
            inputBufferStr += key;
            term.write(key);
        }
    });

    const handleResize = () => { try { fitAddon.fit(); } catch (e) {} };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); term.dispose(); worker.terminate(); };
  }, [isLoaded]);

  useEffect(() => {
    if (isPyodideReady && activeItem && activeItem.language === 'python' && workerRef.current) {
        workerRef.current.postMessage({ type: 'LINT', code: activeItem.content });
    }
  }, [activeFileId, isPyodideReady]);

  const syncItemsFromWorker = (workerFiles) => {
    setItems(prevItems => {
        let updated = [...prevItems];
        let hasChanges = false;

        workerFiles.forEach(wf => {
            const parts = wf.name.split('/');
            let currentParentId = 'root';
            
            for (let i = 0; i < parts.length - 1; i++) {
                const folderName = parts[i];
                let folder = updated.find(item => item.type === 'folder' && item.name === folderName && item.parentId === currentParentId);
                if (!folder) {
                    folder = { id: `folder-${Date.now()}-${Math.random()}`, type: 'folder', name: folderName, parentId: currentParentId };
                    updated.push(folder);
                    hasChanges = true;
                }
                currentParentId = folder.id;
            }

            const fileName = parts[parts.length - 1];
            const existingFileIdx = updated.findIndex(item => item.type === 'file' && item.name === fileName && item.parentId === currentParentId);
            
            if (existingFileIdx >= 0) {
                if (updated[existingFileIdx].content !== wf.content) {
                    updated[existingFileIdx] = { ...updated[existingFileIdx], content: wf.content };
                    hasChanges = true;
                }
            } else {
                updated.push({ id: `file-${Date.now()}-${Math.random()}`, type: 'file', name: fileName, parentId: currentParentId, language: fileName.endsWith('.py') ? 'python' : 'plaintext', content: wf.content });
                hasChanges = true;
            }
        });

        return hasChanges ? updated : prevItems;
    });
  };

  const handleEditorChange = (value) => {
    setItems(prev => prev.map(i => i.id === activeFileId ? { ...i, content: value } : i));
    setSyntaxStatus('checking');
    if (lintTimeoutRef.current) clearTimeout(lintTimeoutRef.current);
    lintTimeoutRef.current = setTimeout(() => {
        if (activeItem?.language === 'python' && workerRef.current) {
            workerRef.current.postMessage({ type: 'LINT', code: value });
        } else {
            setSyntaxStatus('ok');
        }
    }, 600);
  };

  const formatCode = async () => {
    if (!workerRef.current || activeItem?.language !== 'python') return;
    workerRef.current.postMessage({ type: 'FORMAT', code: activeItem.content, fileId: activeFileId });
  };

  const handleEditorDidMount = (editor, monaco) => { editorRef.current = editor; };

  useEffect(() => {
    if (!editorRef.current || !isVisualizerOpen || !traceData) return;
    const currentLine = traceData[currentStep]?.line;
    if (currentLine) {
       const oldDecorations = decorationsRef.current;
       const newDecorations = editorRef.current.deltaDecorations(oldDecorations, [
         { range: new window.monaco.Range(currentLine, 1, currentLine, 1), options: { isWholeLine: true, className: 'visualizer-line-highlight', glyphMarginClassName: 'visualizer-glyph' } }
       ]);
       decorationsRef.current = newDecorations;
       editorRef.current.revealLineInCenter(currentLine);
    }
  }, [currentStep, isVisualizerOpen, traceData]);

  // --- FOLDER & FILE OPERATIONS ---
  const getTargetParentId = () => {
      const active = items.find(i => i.id === activeFileId);
      return active ? active.parentId : 'root';
  };

  const createNewFolder = () => {
      const name = prompt("Enter folder name:");
      if (!name) return;
      const target = getTargetParentId();
      const newId = `folder-${Date.now()}`;
      setItems(prev => [...prev, { id: newId, type: 'folder', name, parentId: target }]);
      setExpandedFolders(prev => ({...prev, [target]: true}));
  };

  const createNewFile = () => {
      const name = prompt("Enter file name (e.g., script.py):");
      if (!name) return;
      const target = getTargetParentId();
      const newId = `file-${Date.now()}`;
      setItems(prev => [...prev, { id: newId, type: 'file', name, parentId: target, language: name.endsWith('.py') ? 'python' : 'plaintext', content: '' }]);
      setExpandedFolders(prev => ({...prev, [target]: true}));
      setActiveFileId(newId);
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;
    const target = getTargetParentId();

    const newFilesPromises = uploadedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => { resolve({ id: `file-${Date.now()}-${Math.random()}`, type: 'file', name: file.name, parentId: target, language: file.name.endsWith('.py') ? 'python' : 'plaintext', content: event.target.result }); };
        reader.readAsText(file);
      });
    });

    Promise.all(newFilesPromises).then(newFilesData => {
      setItems(prev => [...prev, ...newFilesData]);
      setExpandedFolders(prev => ({...prev, [target]: true}));
      setActiveFileId(newFilesData[newFilesData.length - 1].id);
    });
    e.target.value = null;
  };

  const deleteItem = (e, id) => {
    e.stopPropagation();
    if (!window.confirm(`Delete this item?`)) return;
    
    const idsToDelete = new Set([id]);
    const findChildren = (pid) => {
        items.filter(i => i.parentId === pid).forEach(child => {
            idsToDelete.add(child.id);
            findChildren(child.id);
        });
    };
    findChildren(id);
    
    setItems(prev => prev.filter(i => !idsToDelete.has(i.id)));
    if (idsToDelete.has(activeFileId)) {
        const remaining = items.filter(i => i.type === 'file' && !idsToDelete.has(i.id));
        setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const resetFiles = () => {
    if (window.confirm("Reset entire workspace to defaults?")) {
        setItems(DEFAULT_ITEMS);
        setActiveFileId(DEFAULT_ITEMS[0].id);
        if (workerRef.current) workerRef.current.postMessage({ type: 'LINT', code: DEFAULT_ITEMS[0].content });
    }
  };

  const clearTerminal = () => {
    if (xtermRef.current) {
        xtermRef.current.clear();
        xtermRef.current.writeln('\x1b[38;2;59;130;246m[Nexus Engine]\x1b[0m Terminal cleared. Ready.');
    }
  };

  const runCode = async () => {
    if (!workerRef.current || !activeItem) return;
    setIsTerminalCollapsed(false); 
    if (isFullscreen) setIsFullscreen(false); 
    setTimeout(() => fitAddonRef.current?.fit(), 100);
    if (editorRef.current) decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);

    const term = xtermRef.current;
    term.writeln('\r\n\x1b[44m\x1b[37m RUNNING SCRIPT \x1b[0m');

    if (activeItem.name.endsWith('.py')) {
         const filesForWorker = items.filter(i => i.type === 'file').map(i => ({ name: getFullPath(i.id, items), content: i.content }));
         workerRef.current.postMessage({ type: 'RUN', code: activeItem.content, files: filesForWorker });
    } else term.writeln(`\x1b[38;2;234;179;8mWarning: Select a .py file to execute.\x1b[0m`);
  };

  const visualizeCode = async () => {
    if (!workerRef.current || !activeItem) return;
    setIsTerminalCollapsed(false); 
    if (isFullscreen) setIsFullscreen(false);
    setTimeout(() => fitAddonRef.current?.fit(), 100);
    xtermRef.current.writeln('\r\n\x1b[45m\x1b[37m GENERATING VISUALIZATION \x1b[0m');
    const filesForWorker = items.filter(i => i.type === 'file').map(i => ({ name: getFullPath(i.id, items), content: i.content }));
    workerRef.current.postMessage({ type: 'VISUALIZE', files: filesForWorker, tracerCode: TRACER_CODE, activeFilePath: getFullPath(activeFileId, items) });
  };

  // --- RENDERERS ---
  const renderWorkspaceTree = (parentId, depth = 0) => {
    const children = items.filter(i => i.parentId === parentId).sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    return children.map(item => (
        <React.Fragment key={item.id}>
            <div 
              onClick={() => {
                  if (item.type === 'folder') setExpandedFolders(prev => ({...prev, [item.id]: !prev[item.id]}));
                  else setActiveFileId(item.id);
              }}
              style={{ padding: `6px 12px 6px ${12 + depth * 16}px`, cursor: 'pointer', backgroundColor: activeFileId === item.id ? '#1e293b' : 'transparent', color: activeFileId === item.id ? '#f8fafc' : '#94a3b8', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: activeFileId === item.id ? '600' : '400' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {item.type === 'folder' ? (
                    expandedFolders[item.id] ? <FolderOpen size={14} color="#94a3b8" style={{flexShrink: 0}} /> : <Folder size={14} color="#94a3b8" style={{flexShrink: 0}} />
                ) : (
                    <File size={14} color={item.name.endsWith('.py') ? '#3b82f6' : '#94a3b8'} style={{flexShrink: 0}}/> 
                )}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
              </div>
              <Trash2 size={13} style={{ color: '#ef4444', opacity: activeFileId === item.id ? 1 : 0, flexShrink: 0 }} onClick={(e) => deleteItem(e, item.id)} title="Delete"/>
            </div>
            {item.type === 'folder' && expandedFolders[item.id] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{renderWorkspaceTree(item.id, depth + 1)}</div>
            )}
        </React.Fragment>
    ));
  };

  // Fetches code from your public folder and inserts it into the Workspace
  const handleLoadNote = async (node) => {
    try {
        const res = await fetch(node.path);
        if (!res.ok) throw new Error("Failed to load file.");
        const content = await res.text();
        
        const existing = items.find(i => i.type === 'file' && i.name === node.name && i.parentId === 'root');
        if (existing) {
            setActiveFileId(existing.id);
        } else {
            const newId = `file-${Date.now()}`;
            setItems(prev => [...prev, { id: newId, type: 'file', name: node.name, parentId: 'root', language: node.name.endsWith('.py') ? 'python' : 'plaintext', content }]);
            setActiveFileId(newId);
        }
    } catch(e) {
        alert("Error loading note: " + e.message);
    }
  };

  const renderExternalNotesTree = (nodes, currentPath = '') => {
    if (!nodes) return null;
    return nodes.map((node) => {
      const nodePath = `${currentPath}/${node.name}`;
      if (node.type === 'folder') {
        const isExp = expandedNotes[nodePath];
        return (
          <div key={nodePath} style={{ marginBottom: 2 }}>
            <button onClick={() => setExpandedNotes(prev => ({ ...prev, [nodePath]: !prev[nodePath] }))}
              style={{ display:'flex', alignItems:'center', width:'100%', padding:'6px 12px', background: isExp ? '#1e293b' : 'transparent', border:'none', borderRadius:6, color:'#f8fafc', cursor:'pointer', transition:'all 0.2s' }}>
              {isExp ? <ChevronDown size={14} style={{ marginRight:8, color:'#94a3b8' }}/> : <ChevronRight size={14} style={{ marginRight:8, color:'#94a3b8' }}/>}
              <Folder size={14} style={{ marginRight:8, color:'#8b5cf6' }}/>
              <span style={{ fontSize:13, fontWeight:600 }}>{node.name}</span>
            </button>
            {isExp && (
              <div style={{ paddingLeft: 12, marginTop: 2, borderLeft:'1px solid #1e293b', marginLeft: 16 }}>
                {renderExternalNotesTree(node.children, nodePath)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div key={nodePath} style={{ marginBottom: 2 }}>
            <button onClick={() => handleLoadNote(node)}
              style={{ display:'flex', alignItems:'center', width:'100%', padding:'6px 12px', background:'transparent', border:'none', borderRadius:6, color:'#94a3b8', cursor:'pointer', transition:'all 0.2s', textAlign:'left' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e293b'; e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
              <File size={14} style={{ marginRight:8, flexShrink:0, color:'#8b5cf6' }}/>
              <span style={{ fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{node.name}</span>
            </button>
          </div>
        );
      }
    });
  };

  if (!isLoaded) return <div style={{ height: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Booting Workspace...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: '#cbd5e1', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      <input type="file" multiple accept=".py,.txt,.csv,.json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
      {isDraggingVis && <div style={{ position: 'fixed', inset: 0, zIndex: 99999, cursor: 'col-resize' }} />}

      <style>{`
        .visualizer-line-highlight { background: rgba(139, 92, 246, 0.2); border-left: 3px solid #8b5cf6; }
        .visualizer-glyph { background: #8b5cf6; width: 6px !important; border-radius: 3px; margin-left: 2px;}
        .xterm .xterm-viewport { overflow-y: auto !important; }
        .xterm .xterm-viewport::-webkit-scrollbar { width: 8px; }
        .xterm .xterm-viewport::-webkit-scrollbar-track { background: transparent; }
        .xterm .xterm-viewport::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
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
            <button onClick={formatCode} disabled={!isPyodideReady} style={{ backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', transition: 'all 0.2s' }}>
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

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* --- LEFT SIDEBAR (Workspace + App.jsx Style Library) --- */}
        <div className="sidebar-scroll" style={{ display: isFullscreen ? 'none' : 'flex', width: '240px', backgroundColor: '#0f172a', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid #1e293b', overflowY: 'auto' }}>
          
          {/* Section 1: My Workspace */}
          <div style={{ padding: '16px', color: '#64748b', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Explorer 
            <div style={{ display: 'flex', gap: '10px'}}>
                <RotateCcw size={14} style={{ cursor: 'pointer' }} onClick={resetFiles} title="Reset to Defaults" />
                <FolderPlus size={14} style={{ cursor: 'pointer' }} onClick={createNewFolder} title="New Folder" />
                <Upload size={14} style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} title="Upload Files" />
                <FilePlus size={14} style={{ cursor: 'pointer' }} onClick={createNewFile} title="New File" />
            </div>
          </div>
          
          <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2, marginBottom: '20px' }}>
            {renderWorkspaceTree('root')}
          </div>

          <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '0 16px' }} />

          {/* Section 2: External Notes Library (Loaded via JSON like App.jsx) */}
          <div style={{ padding: '16px', color: '#64748b', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <BookOpen size={14} /> My Notes
          </div>

          <div style={{ padding: '0 8px 20px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!notesDb || notesDb.length === 0 ? (
                <div style={{ padding: '8px 12px', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                    No notes indexed. Add .py files to /public/notes/ and run your indexer script.
                </div>
            ) : (
                renderExternalNotesTree(notesDb)
            )}
          </div>
        </div>

        {/* --- CENTER COLUMN (Editor + Terminal) --- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#0f172a' }}>
            
            <div style={{ display: 'flex', backgroundColor: '#020617', borderBottom: '1px solid #1e293b', overflowX: 'auto' }}>
              {items.filter(i => i.type === 'file').map((file) => (
                <div 
                  key={file.id} 
                  onClick={() => { setActiveFileId(file.id); if(workerRef.current) workerRef.current.postMessage({type: 'LINT', code: file.content}); }}
                  style={{ padding: '10px 20px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', backgroundColor: activeFileId === file.id ? '#0f172a' : 'transparent', color: activeFileId === file.id ? '#3b82f6' : '#64748b', borderTop: `2px solid ${activeFileId === file.id ? '#3b82f6' : 'transparent'}`, borderRight: '1px solid #1e293b' }}
                >
                  <File size={14} color={activeFileId === file.id ? '#3b82f6' : '#64748b'}/>
                  {file.name}
                  {items.filter(i => i.type === 'file').length > 1 && (
                    <X size={14} style={{ opacity: activeFileId === file.id ? 0.8 : 0.4, marginLeft: '4px' }} onClick={(e) => deleteItem(e, file.id)} title="Close Tab" />
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: '6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
              <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {activeItem ? (
                      <> <Folder size={12}/> {getFullPath(activeFileId, items).split('/').join(' / ')} </>
                  ) : "No file selected"}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button onClick={() => setEditorFontSize(f => Math.max(10, f - 1))} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer' }}><ZoomOut size={16}/></button>
                    <span style={{ fontSize: '12px', color: '#64748b', width: '30px', textAlign: 'center' }}>{editorFontSize}</span>
                    <button onClick={() => setEditorFontSize(f => Math.min(30, f + 1))} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer' }}><ZoomIn size={16}/></button>
                  </div>
                  <div style={{ width: 1, height: 16, background: '#1e293b' }} />
                  <button onClick={() => { setIsFullscreen(!isFullscreen); setTimeout(() => fitAddonRef.current?.fit(), 100); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {isFullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
                  </button>
              </div>
            </div>
            
            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {activeItem ? (
                  <Editor
                      height="100%"
                      language={activeItem.language}
                      theme="vs-dark"
                      value={activeItem.content}
                      onChange={handleEditorChange}
                      onMount={handleEditorDidMount}
                      options={{ automaticLayout: true, minimap: { enabled: true, scale: 0.75, renderCharacters: false }, fontSize: editorFontSize, fontFamily: "'Fira Code', 'Cascadia Code', monospace", fontLigatures: true, formatOnPaste: true, formatOnType: true, suggestOnTriggerCharacters: true, wordWrap: "on", smoothScrolling: true, cursorSmoothCaretAnimation: "on", cursorBlinking: "smooth", padding: { top: 16 }, scrollBeyondLastLine: false }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No file open.</div>
                )}
            </div>

            {/* THE TERMINAL PANEL (Fixed Height, No Slider) */}
            <div style={{ display: isFullscreen ? 'none' : 'flex', height: isTerminalCollapsed ? 40 : 250, backgroundColor: '#020617', flexDirection: 'column', flexShrink: 0, borderTop: '1px solid #1e293b', transition: 'height 0.2s ease' }}>
                <div style={{ height: '40px', padding: '0 20px', display: 'flex', gap: '20px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
                    <div style={{ color: '#f8fafc', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #3b82f6', marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: 6 }}>
                       <TerminalSquare size={14}/> Terminal
                    </div>
                    <div style={{flex: 1}} />
                    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                        {!isTerminalCollapsed && (
                            <button onClick={clearTerminal} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: '600' }}>
                              <Eraser size={14}/> Clear
                            </button>
                        )}
                        <button onClick={() => { setIsTerminalCollapsed(!isTerminalCollapsed); setTimeout(() => fitAddonRef.current?.fit(), 200); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            {isTerminalCollapsed ? <ChevronUp size={16} color="#3b82f6"/> : <ChevronDown size={16}/>}
                        </button>
                    </div>
                </div>
                <div style={{ flex: 1, padding: '10px 10px 10px 20px', overflow: 'hidden', display: isTerminalCollapsed ? 'none' : 'block' }}>
                    <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
        </div>

        {/* DRAGGABLE VISUALIZER SPLITTER */}
        {isVisualizerOpen && currentTrace && !isFullscreen && (
          <div 
            onPointerDown={(e) => { e.preventDefault(); setIsDraggingVis(true); dragVisRef.current = { x: e.clientX, startW: visualizerWidth }; }}
            style={{ width: '4px', backgroundColor: isDraggingVis ? '#8b5cf6' : '#1e293b', cursor: 'col-resize', zIndex: 10, transition: 'background-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = isDraggingVis ? '#8b5cf6' : '#334155'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = isDraggingVis ? '#8b5cf6' : '#1e293b'}
          />
        )}

        {/* RIGHT COLUMN (Visualizer) */}
        {isVisualizerOpen && currentTrace && !isFullscreen && (
            <div style={{ width: visualizerWidth, backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
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
                <div className="sidebar-scroll" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
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