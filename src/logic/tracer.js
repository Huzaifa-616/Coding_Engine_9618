export const TRACER_CODE = `
import sys
import json
import types

class Tracer:
    def __init__(self):
        self.trace_data = []
    
    def trace_calls(self, frame, event, arg):
        if event != 'line':
            return self.trace_calls
        
        code_filename = frame.f_code.co_filename
        
        # Ignore system files (like library files)
        if code_filename.startswith('<') or 'lib' in code_filename:
            return self.trace_calls

        variables = {}
        # Define a Block List of names we NEVER want to show the student
        blocklist = ['t', 'Tracer', 'start_trace', 'stop_trace', 'code', 'sys', 'json', 'types']

        for var_name, var_val in frame.f_locals.items():
            
            # 1. Ignore Blocklisted names
            if var_name in blocklist:
                continue
            
            # 2. Ignore system variables (starting with _)
            if var_name.startswith('_'):
                continue
            
            # 3. Ignore modules (like 'math' or 'random')
            if isinstance(var_val, types.ModuleType):
                continue
            
            # 4. Ignore functions and classes (we just want data)
            if isinstance(var_val, (types.FunctionType, type)):
                continue

            try:
                variables[var_name] = repr(var_val) 
            except:
                variables[var_name] = "<error>"

        self.trace_data.append({
            "line": frame.f_lineno,
            "file": code_filename,
            "variables": variables
        })
        
        return self.trace_calls

t = Tracer()

def start_trace():
    sys.settrace(t.trace_calls)

def stop_trace():
    sys.settrace(None)
    print("---TRACE_START---")
    print(json.dumps(t.trace_data))
    print("---TRACE_END---")
`;