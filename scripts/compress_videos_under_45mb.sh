#!/usr/bin/env bash
set -euo pipefail

VIDEO_DIR="public/videos"
MAX_MB=45
MAX_BYTES=$((MAX_MB * 1024 * 1024))
MIN_VIDEO_KBPS=220
AUDIO_KBPS=96

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Error: ffmpeg is not installed."
  echo "Install on macOS with: brew install ffmpeg"
  exit 1
fi

get_duration_seconds() {
  local input="$1"

  if command -v ffprobe >/dev/null 2>&1; then
    ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$input" 2>/dev/null || true
    return 0
  fi

  # Fallback when ffprobe is missing: parse ffmpeg stderr Duration field.
  ffmpeg -i "$input" 2>&1 | awk -F 'Duration: |, start' '/Duration:/{print $2; exit}' | awk -F: '{print ($1*3600)+($2*60)+$3}'
}

if [[ ! -d "$VIDEO_DIR" ]]; then
  echo "Error: directory not found: $VIDEO_DIR"
  exit 1
fi

compress_one() {
  local input="$1"
  local original_size
  original_size=$(stat -f%z "$input")

  if (( original_size <= MAX_BYTES )); then
    echo "Skip (already <= ${MAX_MB}MB): $input"
    return 0
  fi

  local duration
  duration=$(get_duration_seconds "$input")

  if [[ -z "$duration" || "$duration" == "N/A" ]]; then
    echo "Skip (could not read duration): $input"
    return 1
  fi

  local duration_int
  duration_int=$(awk -v d="$duration" 'BEGIN { printf "%d", (d < 1 ? 1 : d) }')

  local target_total_kbps
  target_total_kbps=$(awk -v bytes="$MAX_BYTES" -v dur="$duration_int" 'BEGIN { printf "%d", (bytes * 8 / dur / 1000) * 0.97 }')

  local video_kbps=$((target_total_kbps - AUDIO_KBPS))
  if (( video_kbps < MIN_VIDEO_KBPS )); then
    video_kbps=$MIN_VIDEO_KBPS
  fi

  local tmp="${input}.tmp.mp4"
  local try=1

  while (( try <= 6 )); do
    echo "Compressing: $input (try $try, v=${video_kbps}k, a=${AUDIO_KBPS}k)"

    ffmpeg -nostdin -y -hide_banner -loglevel error \
      -i "$input" \
      -c:v libx264 -preset slow -b:v "${video_kbps}k" -maxrate "${video_kbps}k" -bufsize "$((video_kbps * 2))k" \
      -c:a aac -b:a "${AUDIO_KBPS}k" \
      -movflags +faststart \
      "$tmp"

    local new_size
    new_size=$(stat -f%z "$tmp")

    if (( new_size <= MAX_BYTES )); then
      mv "$tmp" "$input"
      echo "Done: $input ($(awk -v s="$new_size" 'BEGIN { printf "%.2f", s/1024/1024 }') MB)"
      return 0
    fi

    rm -f "$tmp"
    video_kbps=$((video_kbps * 85 / 100))
    if (( video_kbps < MIN_VIDEO_KBPS )); then
      video_kbps=$MIN_VIDEO_KBPS
    fi
    try=$((try + 1))
  done

  echo "Failed to push under ${MAX_MB}MB after retries: $input"
  return 1
}

failed=0

while IFS= read -r -d '' file; do
  if ! compress_one "$file"; then
    failed=1
  fi
done < <(find "$VIDEO_DIR" -type f \( -iname "*.mp4" -o -iname "*.mov" -o -iname "*.m4v" -o -iname "*.webm" -o -iname "*.mkv" -o -iname "*.avi" \) -print0)

if (( failed == 0 )); then
  echo "All videos processed."
else
  echo "Completed with some failures."
  exit 1
fi
