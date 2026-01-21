import glob
import json

engine_by_type = {
    "match": "MatchEngine",
    "flow": "FlowEngine",
    "classification": "ClassificationEngine"
}

index_entries = []

for file_path in glob.glob("content/**/*.json", recursive=True):
    if "index.json" in file_path:
        continue

    try:
        directory_parts = file_path.split("\\")[:-1]
    except Exception:
        directory_parts = [""]

    with open(file_path, "r", encoding="utf-8") as file:
        content_json = json.load(file)

    print(directory_parts)

    index_entry = {
        "path": directory_parts[1:],  # remove "content"
        "type": content_json["type"],
        "title": content_json["title"],
        "description": content_json["description"],
        "engine": engine_by_type[content_json["type"]],
        "file": file_path
    }

    index_entries.append(index_entry)

with open("content/index.json", "w", encoding="utf-8") as index_file:
    json.dump(index_entries, index_file, ensure_ascii=False, indent=2)
