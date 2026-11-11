"""Generate French recordings with ElevenLabs v4 (resumable)."""
from pathlib import Path
import subprocess
import sys

subprocess.run([sys.executable, str(Path(__file__).resolve().parents[2] / 'scripts' / 'generate-learning-audio.py'),
                '--activity', 'dictee', *sys.argv[1:]], check=True)
