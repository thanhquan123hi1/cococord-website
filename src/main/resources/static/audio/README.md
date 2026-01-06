# Audio Assets

## Ringtone

Place a ringtone audio file named `ringtone.mp3` in this directory for incoming/outgoing call notifications.

### Recommended Specifications:
- Format: MP3
- Duration: 2-5 seconds (will loop)
- Sample Rate: 44.1kHz
- Bitrate: 128-192kbps

### Fallback Behavior:
If `ringtone.mp3` is not found or fails to load, the CallManager will automatically use a Web Audio API oscillator-based fallback ringtone (simple 440Hz beep).

### Suggested Sound:
A pleasant, recognizable ringtone similar to Discord's call notification sound.
