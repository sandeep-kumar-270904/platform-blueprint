import os

def search_files(directory, extensions, search_terms):
    results = {term: [] for term in search_terms}
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                        for term in search_terms:
                            if term.lower() in content or term.lower() in file.lower():
                                results[term].append(path)
                except:
                    pass
    return results

backend_terms = [
    'resume', 'gemini scoring', 'pdf export', 'job board', 'share', 'version history',
    'analytic', 'cover letter', 'import', 'admin', 'portfolio', 'feedback', 'insight', 
    'multi-format', 'job-tailoring', 'tailor', 'certification', 'success stor', 'institution', 
    'interview', 'salary', 'linkedin', 'timeline', 'accessibil', 'gamification', 'discovery',
    'multilingual', 'freelance', 'recommendation', 'simulator', 'voice', 'workshop', 
    'health monitor', 'developer api', 'archive', 'narrative', 'rejection', 'skill verification',
    'white-label', 'micro-credential', 'panic', 'sponsor', 'annual reflection', 'campaign',
    'benchmark', 'capsule', 'offline', 'vital', 'multi-offer', 'marketplace', 'legacy'
]

print("Searching backend...")
backend_results = search_files("backend", ['.js'], backend_terms)
for term, paths in backend_results.items():
    if paths:
        print(f"B: {term} -> {len(paths)} files")

print("\nSearching frontend...")
frontend_results = search_files("src", ['.tsx', '.ts'], backend_terms)
for term, paths in frontend_results.items():
    if paths:
        print(f"F: {term} -> {len(paths)} files")

