"""Generate src/config.js from filenames only. Never copies or uploads images."""
from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {'.webp', '.jpg', '.jpeg', '.png', '.avif', '.gif'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path, help='local wallpaper directory (top level only)')
    parser.add_argument('--base-path', default='/d/_kk_wallpapers/', help='public direct-link URL prefix')
    parser.add_argument('--output', type=Path, default=ROOT / 'src/config.js')
    args = parser.parse_args()
    if not args.directory.is_dir():
        parser.error('Wallpaper directory does not exist')
    entries = [{'file': p.name, 'title': p.stem} for p in sorted(args.directory.iterdir())
               if p.is_file() and p.suffix.lower() in EXTENSIONS]
    config = {'basePath': args.base_path, 'wallpapers': entries,
              'storageKey': 'kk-openlist-wallpaper-queue-v2', 'loadTimeout': 8000, 'showButton': True}
    args.output.write_text('/* Generated from filenames; images are not included. */\n'
                          'window.KK_OPENLIST_THEME = ' + json.dumps(config, ensure_ascii=False, indent=2)
                          + ';\n', encoding='utf-8')
    print(f'Configured {len(entries)} wallpapers in {args.output}. Run python scripts/build.py next.')


if __name__ == '__main__':
    main()
