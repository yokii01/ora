import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_content = content
    modified = False
    
    if '<Loader2' in content:
        content = re.sub(r'<Loader2([^>]*)>', r'<LoadingSpinner inline\1>', content)
        modified = True

    div_spinner_pattern = r'<div[^>]*animate-spin[^>]*>(?:</div>)?'
    if re.search(div_spinner_pattern, content):
        content = re.sub(div_spinner_pattern, r'<LoadingSpinner inline size="md" />', content)
        modified = True

    if modified:
        if 'LoadingSpinner' not in orig_content:
            imports = list(re.finditer(r'^import .*;', content, flags=re.MULTILINE))
            if imports:
                last_import = imports[-1]
                insert_pos = last_import.end()
                content = content[:insert_pos] + "\nimport LoadingSpinner from '@/components/shared/LoadingSpinner';" + content[insert_pos:]
            else:
                content = "import LoadingSpinner from '@/components/shared/LoadingSpinner';\n" + content

        # Remove Loader2 from imports
        content = re.sub(r'(\bLoader2\b\s*,\s*|\s*,\s*\bLoader2\b|\bLoader2\b)', '', content)
        content = re.sub(r'import\s*{\s*}\s*from\s*[\'"]lucide-react[\'"];\n?', '', content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('c:/Users/Yoghes/Downloads/ORAs/src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            # Skip the component itself
            if file == 'LoadingSpinner.jsx': continue
            process_file(os.path.join(root, file))
