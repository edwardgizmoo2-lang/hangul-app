import edge_tts
import asyncio
import os

BASE = 0xAC00

INITIALS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
MEDIALS = ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']

INITIAL_INDEX = {'ㄱ':0,'ㄲ':1,'ㄴ':2,'ㄷ':3,'ㄸ':4,'ㄹ':5,'ㅁ':6,'ㅂ':7,'ㅃ':8,'ㅅ':9,'ㅆ':10,'ㅇ':11,'ㅈ':12,'ㅉ':13,'ㅊ':14,'ㅋ':15,'ㅌ':16,'ㅍ':17,'ㅎ':18}
MEDIAL_INDEX = {'ㅏ':0,'ㅑ':2,'ㅓ':4,'ㅕ':6,'ㅗ':8,'ㅛ':12,'ㅜ':13,'ㅠ':16,'ㅡ':18,'ㅣ':20}

def compose(initial, medial):
    return chr(BASE + INITIAL_INDEX[initial] * 21 * 28 + MEDIAL_INDEX[medial] * 28)

async def main():
    out = 'public/audio/syllables'
    os.makedirs(out, exist_ok=True)

    syllables = []
    for c in INITIALS:
        for v in MEDIALS:
            syllables.append(compose(c, v))

    print(f'Total: {len(syllables)} syllables')

    for i, syl in enumerate(syllables):
        path = os.path.join(out, f'{syl}.ogg')
        if os.path.exists(path):
            print(f'[{i+1}/{len(syllables)}] SKIP U+{ord(syl):04X}')
            continue
        print(f'[{i+1}/{len(syllables)}] U+{ord(syl):04X}...')
        try:
            await edge_tts.Communicate(syl, voice='ko-KR-SunHiNeural').save(path)
        except Exception as e:
            print(f'  FAILED: {e}')

    print('\nDone!')

asyncio.run(main())
