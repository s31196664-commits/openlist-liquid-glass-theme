"""Build paste-ready OpenList settings and a source ZIP; Python stdlib only."""
from pathlib import Path
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def build():
    dist = ROOT / 'dist'
    dist.mkdir(exist_ok=True)
    css = (ROOT / 'src/theme.css').read_text(encoding='utf-8')
    config = (ROOT / 'src/config.js').read_text(encoding='utf-8')
    script = (ROOT / 'src/wallpaper.js').read_text(encoding='utf-8')
    # Prevent literal closing tags in configured strings from ending the wrapper.
    body = '<script>\n' + (config + '\n' + script).replace('</script', '<\\/script') + '\n</script>\n'
    head = '<!-- KK OpenList Liquid Glass · MIT · see LICENSE and NOTICE -->\n<style id="kk-openlist-glass">\n' + css + '</style>\n'
    (dist / 'customize-head.html').write_text(head, encoding='utf-8')
    (dist / 'customize-body.html').write_text(body, encoding='utf-8')
    (dist / 'settings.json').write_text(json.dumps({
        'customize_head': head, 'customize_body': body
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Built dist/customize-head.html, customize-body.html, settings.json')


def package():
    output = ROOT.parent / 'openlist-liquid-glass-theme-v1.0.0.zip'
    # An explicit allowlist keeps local pictures, databases and credentials out.
    files = ['README.md', 'LICENSE', 'NOTICE', '.gitignore', 'package.json',
             'src/theme.css', 'src/config.js', 'src/wallpaper.js',
             'scripts/build.py', 'scripts/configure_wallpapers.py',
             'docs/INSTALL.md', 'docs/WALLPAPERS.md', 'wallpapers/README.md',
             'tests/wallpaper.test.cjs', '.github/workflows/check.yml',
             'dist/customize-head.html', 'dist/customize-body.html', 'dist/settings.json']
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in files:
            archive.write(ROOT / name, 'openlist-liquid-glass-theme/' + name)
    print(output)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--zip', action='store_true', help='also create a wallpaper-free source ZIP')
    args = parser.parse_args()
    build()
    if args.zip:
        package()
