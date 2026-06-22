import json
import ast

with open('old_climora.txt', 'r', encoding='utf-8') as f:
    text = f.read().strip()

if text.startswith('"') and text.endswith('"'):
    try:
        text = json.loads(text)
        print("Decoded as JSON")
    except Exception as e:
        print('JSON load failed:', e)
        try:
            text = ast.literal_eval(text)
            print("Decoded as AST")
        except Exception as e2:
            print('AST eval failed:', e2)

with open('parsed_old_climora.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Done!')
