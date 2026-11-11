"""Generate the two learning activities' offline recordings with ElevenLabs v4.

Reads ELEVENLABS_API_KEY or ~/.codex/secrets/elevenlabs_api_key at runtime.
Never writes credentials to this repository. Requires ffmpeg and ffprobe.
Runs up to two requests concurrently and resumes from each activity's manifest.
"""
import argparse
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
MODEL = 'eleven_v4'
VOICES = {
    'healthy-lifestyle': {'id': 'Xb7hH8MSUJpSbSDYk0k2', 'name': 'Alice', 'language': 'en'},
    'dictee': {'id': 'Jrq4GqCKqYpigdQsZRkP', 'name': 'Anatole', 'language': 'fr'},
}


def tracks(activity):
    root = ROOT / 'felix' / activity
    source = root / ('content.json' if activity == 'healthy-lifestyle' else 'texte.json')
    content = json.loads(source.read_text())
    if activity == 'healthy-lifestyle':
        return [(item['id'], item['en']) for item in content['vocabulary'] + content['phrases']] + [
            (item['id'], item['text']) for item in content['listening']
        ] + [(item['id'], item['model']) for item in content['oral']]
    result = []
    for section in content['sections']:
        result += [(f"{section['id']}-{i}", text) for i, text in enumerate(section['chunks'])]
        result += [(f"{section['id']}-word-{i}", item['word']) for i, item in enumerate(section['words'])]
    return result


def digest(value):
    return hashlib.sha256(value).hexdigest()


def validate(path):
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'null', '-'],
                   check=True, capture_output=True)
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                            '-of', 'default=noprint_wrappers=1:nokey=1', str(path)],
                           check=True, capture_output=True, text=True)
    duration = float(probe.stdout)
    if not 0.15 < duration < 180:
        raise RuntimeError('Generated audio has an unexpected duration')
    return round(duration, 3)


def generate(activity, name, text, key):
    voice = VOICES[activity]
    payload = {'model_id': MODEL, 'language_code': voice['language'],
               'inputs': [{'text': text, 'voice_id': voice['id']}], 'seed': 42}
    request = urllib.request.Request(
        'https://api.elevenlabs.io/v1/text-to-dialogue?output_format=mp3_44100_128',
        data=json.dumps(payload).encode(),
        headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                audio = response.read()
                content_type = response.headers.get('Content-Type', '')
            if 'audio' not in content_type or len(audio) < 1000:
                raise RuntimeError('ElevenLabs returned invalid audio')
            break
        except urllib.error.HTTPError as error:
            # Print status codes only; response bodies may contain account data.
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise RuntimeError(f'ElevenLabs request failed (HTTP {error.code})') from None
            time.sleep(2 ** (attempt + 1))
        except (urllib.error.URLError, TimeoutError):
            # Do not retry ambiguous timeouts: a paid generation may have completed.
            raise RuntimeError('ElevenLabs connection failed; rerun to resume completed tracks') from None
    folder = ROOT / 'felix' / activity / 'audio'
    folder.mkdir(exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.mp3', dir=folder, delete=False) as output:
            output.write(audio)
            temporary = Path(output.name)
        duration = validate(temporary)
        temporary.replace(folder / f'{name}.mp3')
    finally:
        if temporary and temporary.exists():
            temporary.unlink()
    return {'text_sha256': digest(text.encode()), 'audio_sha256': digest(audio),
            'model_id': MODEL, 'voice_id': voice['id'], 'language': voice['language'],
            'duration_seconds': duration, 'generated_at': datetime.now(timezone.utc).isoformat()}



def combine_passages():
    """Build a single seekable track per passage from the verified phrase clips."""
    root = ROOT / 'felix' / 'dictee'
    manifest_path = root / 'audio-manifest.json'
    manifest = json.loads(manifest_path.read_text())
    content = json.loads((root / 'texte.json').read_text())
    for section in content['sections']:
        sources = [f"{section['id']}-{i}" for i in range(len(section['chunks']))]
        source_hashes = [manifest['tracks'][name]['audio_sha256'] for name in sources]
        target = root / 'audio' / f"{section['id']}-passage.mp3"
        entry = manifest['tracks'].get(f"{section['id']}-passage", {})
        if target.exists() and entry.get('source_hashes') == source_hashes and entry.get('audio_sha256') == digest(target.read_bytes()):
            continue
        with tempfile.TemporaryDirectory() as directory:
            listing = Path(directory) / 'phrases.txt'
            listing.write_text(''.join("file '" + str(root / 'audio' / f'{name}.mp3') + "'\n" for name in sources))
            temporary = Path(directory) / 'passage.mp3'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(listing),
                            '-codec:a', 'libmp3lame', '-b:a', '128k', str(temporary)], check=True, capture_output=True)
            audio = temporary.read_bytes()
            duration = validate(temporary)
        # Stage in the destination directory so replacement stays atomic.
        staged = target.with_suffix('.tmp')
        staged.write_bytes(audio)
        staged.replace(target)
        manifest['tracks'][f"{section['id']}-passage"] = {
            'model_id': MODEL, 'voice_id': VOICES['dictee']['id'], 'language': 'fr',
            'derived_from': sources, 'source_hashes': source_hashes,
            'text_sha256': digest(' '.join(section['chunks']).encode()),
            'audio_sha256': digest(audio), 'duration_seconds': duration,
        }
    staged = manifest_path.with_suffix('.tmp')
    staged.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    staged.replace(manifest_path)
    print('13 seekable passage tracks ready.', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--activity', choices=list(VOICES), action='append')
    parser.add_argument('--force', action='store_true', help='Regenerate even matching manifest entries')
    parser.add_argument('--limit', type=int, help='Limit new generations for a sample run')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    activities = args.activity or list(VOICES)
    manifests, jobs = {}, []
    for activity in activities:
        path = ROOT / 'felix' / activity / 'audio-manifest.json'
        manifest = json.loads(path.read_text()) if path.exists() else {'provider': 'ElevenLabs', 'model_id': MODEL, 'voice': VOICES[activity], 'tracks': {}}
        manifests[activity] = manifest
        for name, text in tracks(activity):
            target = ROOT / 'felix' / activity / 'audio' / f'{name}.mp3'
            entry = manifest['tracks'].get(name, {})
            if not args.force and target.exists() and entry.get('model_id') == MODEL and entry.get('voice_id') == VOICES[activity]['id'] and entry.get('text_sha256') == digest(text.encode()) and entry.get('audio_sha256') == digest(target.read_bytes()):
                continue
            jobs.append((activity, name, text))
    if args.limit is not None:
        jobs = jobs[:args.limit]
    print(f'{len(jobs)} recordings to generate ({sum(len(text) for _, _, text in jobs)} characters)', flush=True)
    if args.dry_run:
        return
    if not jobs:
        if 'dictee' in activities:
            combine_passages()
        return
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        key = (Path.home() / '.codex' / 'secrets' / 'elevenlabs_api_key').read_text().strip()
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        pending = {pool.submit(generate, activity, name, text, key): (activity, name) for activity, name, text in jobs}
        for count, future in enumerate(concurrent.futures.as_completed(pending), 1):
            activity, name = pending[future]
            try:
                entry = future.result()
            except Exception as error:
                # No raw exception payload or credentials are printed.
                failures.append(f'{activity}/{name}')
                print(f'{count}/{len(jobs)} FAILED {activity}/{name} ({type(error).__name__})', flush=True)
                continue
            manifest = manifests[activity]
            manifest['tracks'][name] = entry
            manifest['model_id'] = MODEL
            manifest['voice'] = VOICES[activity]
            path = ROOT / 'felix' / activity / 'audio-manifest.json'
            temporary = path.with_suffix('.tmp')
            temporary.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
            temporary.replace(path)
            print(f'{count}/{len(jobs)} ready {activity}/{name} ({entry["duration_seconds"]}s)', flush=True)
    if not failures and 'dictee' in activities and args.limit is None:
        combine_passages()
    if failures:
        raise SystemExit(f'{len(failures)} failed tracks; rerun to resume: ' + ', '.join(failures))


if __name__ == '__main__':
    main()
