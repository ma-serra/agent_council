"""
Busca arquivos na máquina Windows via Everything HTTP server.
Uso: python search_everything.py "termo" --ip 192.168.x.x
"""
import sys
import json
import urllib.request
import urllib.parse

def search(term, ip="localhost", port=8080, regex=False, count=50):
    params = {
        "s": term,
        "json": "1",
        "count": str(count),
        "path_column": "1",
        "date_modified_column": "1",
        "size_column": "1",
    }
    if regex:
        params["regex"] = "1"

    url = f"http://{ip}:{port}/?" + urllib.parse.urlencode(params)

    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read())
            results = data.get("results", [])
            total = data.get("totalResults", 0)
            print(f"Total: {total} resultado(s)\n")
            for item in results:
                name = item.get("name", "")
                path = item.get("path", "")
                print(f"  {path}\\{name}")
            return results
    except Exception as e:
        print(f"Erro: {e}")
        print(f"Verifique se Everything HTTP server está rodando em {ip}:{port}")
        print("Execute: tools/enable_everything_server.ps1")
        return []

if __name__ == "__main__":
    term = sys.argv[1] if len(sys.argv) > 1 else "artefato"
    ip = "localhost"
    regex = False

    for i, arg in enumerate(sys.argv):
        if arg == "--ip" and i+1 < len(sys.argv):
            ip = sys.argv[i+1]
        if arg == "--regex":
            regex = True

    search(term, ip=ip, regex=regex)
