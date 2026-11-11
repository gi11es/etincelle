"""Generate British English recordings with ElevenLabs v4 (resumable)."""
from pathlib import Path
import subprocess
import sys

subprocess.run([sys.executable, str(Path(__file__).resolve().parents[2] / 'scripts' / 'generate-learning-audio.py'),
                '--activity', 'healthy-lifestyle', *sys.argv[1:]], check=True)
