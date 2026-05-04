"""Direct test of Gemini 2.5 Flash Image editing with a real face photo."""
import base64, json, os, sys, urllib.request, urllib.error

ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
SAMPLE = os.path.join(os.path.dirname(__file__), "..", "dist", "hair-references", "m-ash-perm.jpg")


def load_key():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("VITE_GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip()
    sys.exit("No VITE_GEMINI_API_KEY in .env")


def main():
    key = load_key()
    with open(SAMPLE, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")

    body = {
        "contents": [{
            "role": "user",
            "parts": [
                {"inlineData": {"mimeType": "image/jpeg", "data": b64}},
                {"text": "Edit ONLY the hair in this photo to a long wavy hairstyle. Keep the face, skin, and all other features unchanged. Return the edited image."}
            ]
        }],
        "generationConfig": {"responseModalities": ["image"]}
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={key}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=120)
        data = json.loads(resp.read())
        print("HTTP", resp.status)
    except urllib.error.HTTPError as e:
        print("HTTP ERROR", e.code)
        body = e.read().decode("utf-8", "replace")
        print(body[:1000])
        return

    if "candidates" not in data:
        print("UNEXPECTED:", json.dumps(data)[:800])
        return
    c = data["candidates"][0]
    print("finishReason:", c.get("finishReason"))
    for p in c.get("content", {}).get("parts", []):
        if "inlineData" in p:
            mt = p["inlineData"].get("mimeType")
            img_b64 = p["inlineData"].get("data", "")
            print(f"IMAGE returned: {mt}, base64 length {len(img_b64)}")
            out = os.path.join(os.path.dirname(SAMPLE), "..", "..", "scripts", "gemini-test-output.png")
            with open(out, "wb") as f:
                f.write(base64.b64decode(img_b64))
            print("Saved to:", os.path.abspath(out))
        elif "text" in p:
            print("TEXT:", p["text"][:500])


if __name__ == "__main__":
    main()
