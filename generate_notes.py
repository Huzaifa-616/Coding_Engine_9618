import os
import json

def get_size_format(b):
    """Converts bytes to a human-readable format."""
    for unit in ["B", "KB", "MB"]:
        if b < 1024:
            return f"{b:.1f} {unit}"
        b /= 1024
    return f"{b:.1f} GB"

def build_tree(dir_path, base_url="/notes/"):
    """Recursively scans the directory and builds the JSON tree."""
    tree = []
    
    for entry in os.scandir(dir_path):
        if entry.is_dir():
            # Recursively scan subfolders
            children = build_tree(entry.path, base_url + entry.name + "/")
            if children:  # Only add the folder if it has files inside
                tree.append({
                    "type": "folder",
                    "name": entry.name,
                    "children": children
                })
        elif entry.is_file() and entry.name.endswith('.py'):
            # Add Python files
            tree.append({
                "type": "file",
                "name": entry.name,
                "path": base_url + entry.name,
                "size": get_size_format(entry.stat().st_size)
            })
            
    # Sort: Folders first, then files alphabetically
    return sorted(tree, key=lambda x: (x['type'] != 'folder', x['name'].lower()))

if __name__ == "__main__":
    notes_dir = "./public/notes"
    output_file = "./public/notes_db.json"
    
    # Safety check
    if not os.path.exists(notes_dir):
        os.makedirs(notes_dir)
        print(f"Created {notes_dir}. Please drop your .py files in there and run this again.")
    else:
        # Build the JSON
        tree = build_tree(notes_dir)
        
        # Save to public folder
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(tree, f, indent=4)
            
        print(f"✅ Successfully indexed your notes into {output_file}!")