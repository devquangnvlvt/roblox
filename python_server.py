import http.server
import socketserver
import os
import json
import re
import shutil
from urllib.parse import parse_qs

PORT = 4953
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Mapping between categories and their folders/config files
CATEGORY_MAP = {
    "hair": {
        "folder": "public/image/hair/",
        "config": "public/js/data/accessories_config.json",
        "attachment": "Head"
    },
    "glasses": {
        "folder": "public/image/glasses/",
        "config": "public/js/data/glasses_config.json",
        "attachment": "FaceCenter"
    },
    "wings": {
        "folder": "public/image/wing/",
        "config": "public/js/data/wings_config.json",
        "attachment": "BodyBack"
    },
    "neck": {
        "folder": "public/image/neck/",
        "config": "public/js/data/neck_config.json",
        "attachment": "Neck"
    },
    "righthand": {
        "folder": "public/image/righthand/",
        "config": "public/js/data/righthand_config.json",
        "attachment": "RightGrip"
    },
    "lefthand": {
        "folder": "public/image/lefthand/",
        "config": "public/js/data/lefthand_config.json",
        "attachment": "LeftGrip"
    },
    "shoulder": {
        "folder": "public/image/shoulder/",
        "config": "public/js/data/shoulder_config.json",
        "attachment": "LeftShoulder"
    },
    "hat": {
        "folder": "public/image/hat/",
        "config": "public/js/data/hat_config.json",
        "attachment": "Hat"
    },
    "waist": {
        "folder": "public/image/waist/",
        "config": "public/js/data/waist_config.json",
        "attachment": "WaistCenter"
    }
}

class BackendHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == '/api/upload':
            self.handle_upload()
        elif self.path == '/api/save_config':
            self.handle_save_config()
        else:
            self.send_error(404, "Not Found")

    def handle_save_config(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_api_response(False, "Empty request")
                return

            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            category = data.get('category')
            filename = data.get('filename')
            char_id = data.get('charId')
            coords = data.get('coords')

            if not all([category, filename, char_id, coords]):
                self.send_api_response(False, "Missing parameters for saving")
                return

            if category not in CATEGORY_MAP:
                self.send_api_response(False, f"Invalid category: {category}")
                return

            cat_info = CATEGORY_MAP[category]
            config_path = os.path.join(DIRECTORY, cat_info['config'])

            if not os.path.exists(config_path):
                self.send_api_response(False, "Config file not found")
                return

            # Read current config
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)

            if filename not in config:
                self.send_api_response(False, f"Accessory {filename} not found in config")
                return

            # Update the specific character's coordinates
            config[filename][char_id] = {
                "x": int(coords.get('x', 0)),
                "y": int(coords.get('y', 0)),
                "z": int(coords.get('z', 0)),
                "rx": int(coords.get('rx', 0)),
                "ry": int(coords.get('ry', 0)),
                "rz": int(coords.get('rz', 0)),
                "scale": float(coords.get('scale', 1.0))
            }

            # Write back
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            print(f"Saved coordinates for {filename} ({char_id}) to {config_path}")
            self.send_api_response(True, f"Đã lưu tọa độ cho {filename}!")

        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_api_response(False, f"Save Error: {str(e)}")

    def handle_upload(self):
        try:
            content_type = self.headers.get('Content-Type', '')
            if 'multipart/form-data' not in content_type:
                self.send_api_response(False, "Invalid Content-Type")
                return

            # More robust boundary extraction
            boundary = None
            for part in content_type.split(';'):
                part = part.strip()
                if part.startswith('boundary='):
                    boundary = part.split('=')[1].encode()
                    break
            
            if not boundary:
                self.send_api_response(False, "No boundary found in Content-Type")
                return

            print(f"Uploading with boundary: {boundary.decode()}")
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_api_response(False, "Empty request")
                return

            body = self.rfile.read(content_length)
            
            # Use raw boundary with prefix
            sep = b'--' + boundary
            parts = body.split(sep)
            
            data = {}
            file_content = None
            filename = None

            for part in parts:
                # Skip preamble and epilogue
                if not part or part.strip() == b'--': continue
                
                header_end = part.find(b'\r\n\r\n')
                if header_end == -1: continue
                
                headers = part[:header_end].decode('utf-8', errors='ignore')
                content = part[header_end+4:]
                
                # Strip trailing CRLF that precedes the next boundary
                if content.endswith(b'\r\n'):
                    content = content[:-2]

                if 'name="category"' in headers:
                    data['category'] = content.decode('utf-8').strip()
                elif 'name="file"' in headers:
                    file_content = content
                    fn_match = re.search(r'filename="([^"]+)"', headers)
                    if fn_match:
                        filename = fn_match.group(1)

            if not data.get('category') or not file_content or not filename:
                print(f"DEBUG: Category: {data.get('category')}, HasContent: {file_content is not None}, Filename: {filename}")
                self.send_api_response(False, "Missing category or file data")
                return

            category = data['category']
            if category not in CATEGORY_MAP:
                self.send_api_response(False, f"Invalid category: {category}")
                return

            cat_info = CATEGORY_MAP[category]
            save_dir = os.path.join(DIRECTORY, cat_info['folder'])
            os.makedirs(save_dir, exist_ok=True)
            
            save_path = os.path.join(save_dir, filename)
            with open(save_path, 'wb') as f:
                f.write(file_content)
            
            print(f"Saved file to: {save_path}")

            # Update JSON config
            config_path = os.path.join(DIRECTORY, cat_info['config'])
            self.update_json_config(config_path, filename, cat_info['attachment'])

            self.send_api_response(True, f"Uploaded {filename} to {category}", {"filename": filename})
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_api_response(False, f"Server Error: {str(e)}")

    def update_json_config(self, config_path, filename, attachment):
        try:
            config = {}
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)

            if filename not in config:
                # Default template (fallback)
                template = {
                    "default": { "x": 0, "y": 0, "z": 0, "rx": 0, "ry": 0, "rz": 0, "scale": 1.0 },
                    "man": { "x": 0, "y": 0, "z": 0, "rx": 0, "ry": 0, "rz": 0, "scale": 1.0 },
                    "woman": { "x": 0, "y": 0, "z": 0, "rx": 0, "ry": 0, "rz": 0, "scale": 1.0 },
                    "rounded": { "x": 0, "y": 0, "z": 0, "rx": 0, "ry": 0, "rz": 0, "scale": 1.0 }
                }

                # Try to copy from the first existing entry if available
                if config:
                    first_key = next(iter(config))
                    first_entry = config[first_key]
                    for key in ["default", "man", "woman", "rounded"]:
                        if key in first_entry:
                            template[key] = first_entry[key].copy()
                            # Ensure rz exists in copied template even if missing in source
                            if "rz" not in template[key]:
                                template[key]["rz"] = 0

                config[filename] = {
                    "label": filename.replace('.glb', '').replace('-', ' ').title(),
                    "attachment": attachment,
                    **template
                }
                
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(config, f, ensure_ascii=False, indent=2)
                print(f"Updated config: {config_path}")
        except Exception as e:
            print(f"Error updating JSON: {e}")

    def send_api_response(self, success, message, extra=None):
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            res = {"success": success, "message": message}
            if extra: res.update(extra)
            self.wfile.write(json.dumps(res).encode('utf-8'))
        except Exception as e:
            print(f"Error sending response: {e}")

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), BackendHandler) as httpd:
        print(f"Server started at http://localhost:{PORT}")
        print(f"Serving directory: {DIRECTORY}")
        httpd.serve_forever()
