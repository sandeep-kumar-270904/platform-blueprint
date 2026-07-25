import sys
import re

def main():
    path = r"c:\Users\edhub\Desktop\Anti Gravity Projects\platform-blueprint\backend\routes\news.js"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the declaration block
    block = """// Simulated AI Moderation Helper
const assessModeration = async (text) => {
  const t = text.toLowerCase();
  if (t.includes('spam') || t.includes('viagra') || t.includes('crypto scam')) {
    return { flagged: true, reason: 'Suspected spam/scam content detected by AI' };
  }
  return { flagged: false, reason: null };
};"""

    # Replace multiple occurrences with a placeholder, then put it back once at the first occurrence
    
    # We will just find all matches using regex because spacing might differ
    pattern = re.compile(r'// Simulated AI Moderation Helper\s*const assessModeration = async \(text\) => {.*?};', re.DOTALL)
    
    matches = list(pattern.finditer(content))
    if len(matches) > 1:
        print(f"Found {len(matches)} declarations, removing duplicates.")
        # Keep the first one, remove the rest
        # To do this safely, we reverse iterate and delete
        for match in reversed(matches[1:]):
            content = content[:match.start()] + content[match.end():]
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Duplicates removed.")
    else:
        print("No duplicates found or pattern mismatch.")

if __name__ == '__main__':
    main()
