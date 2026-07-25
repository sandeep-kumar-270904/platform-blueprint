import os

def main():
    path = r"c:\Users\edhub\Desktop\Anti Gravity Projects\platform-blueprint\backend\db.js"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    injection = """
    const seedLocalFallback = require('./scripts/seedLocalFallback');
    await seedLocalFallback();
"""
    if "seedLocalFallback" not in content:
        # Find the line console.log(`MongoDB (In-Memory) Connected: ${conn.connection.host}`);
        idx = content.find("console.log(`MongoDB (In-Memory) Connected")
        if idx != -1:
            end = content.find("\n", idx)
            content = content[:end+1] + injection + content[end+1:]
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("Injected seedLocalFallback into db.js")
        else:
            print("Could not find insertion point in db.js")
    else:
        print("Already injected.")

if __name__ == '__main__':
    main()
