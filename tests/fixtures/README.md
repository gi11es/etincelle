`oral-family.wav` is a 48 kHz mono PCM copy of the synthetic ElevenLabs v4
recording `felix/healthy-lifestyle/audio/o1-q1.mp3`: “I can see a family in the
kitchen.” Chromium uses it as fake microphone input in the real speech test.
It contains no child's recording. Keeping PCM here avoids installing a media
converter on CI runners just to open a fake microphone.
