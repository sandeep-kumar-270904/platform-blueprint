import os

def main():
    routes_path = r"c:\Users\edhub\Desktop\Anti Gravity Projects\platform-blueprint\backend\routes\news.js"
    with open(routes_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Inject mutedSources check
    if "mutedSources" not in content:
        injection = """
        if (prefs.mutedSources && prefs.mutedSources.length > 0) {
          query.sourceName = { $nin: prefs.mutedSources };
        }
"""
        # Find where delete query.$or is
        idx = content.find("if (query.$or.length === 0) delete query.$or;")
        if idx != -1:
            # insert after that line
            end_of_line = content.find("\n", idx)
            content = content[:end_of_line] + injection + content[end_of_line:]
            with open(routes_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("Fixed news.js mutedSources logic.")
        else:
            print("Could not find insertion point in news.js")

if __name__ == '__main__':
    main()
