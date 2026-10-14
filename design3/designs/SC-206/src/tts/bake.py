"""SC-206: the narration bake-off. One sample paragraph in each free Indian-English voice, sentence by sentence:
Veena's studio voices, Maya1 described as an Indian woman, Svara's Indian English female. On the Mac's GPU (MPS),
one model at a time; every model speaks SNAC codes at 24 kHz.
   .venv-snac/bin/python bake.py sample.txt bake/ [veena,maya1,svara]"""
import sys, re, gc, time, json, numpy as np, soundfile as sf, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from snac import SNAC

DEV = 'mps' if torch.backends.mps.is_available() else 'cpu'
OFF = 128266  # the first SNAC code's token id, in all three
snac = SNAC.from_pretrained('hubertsiuzdak/snac_24khz').eval().to(DEV)


def decode(codes):
    """Seven codes a frame, unpacked to SNAC's three levels (1, 2 and 4 codes a frame)."""
    n = len(codes) // 7
    if n == 0: return np.zeros(0, np.float32)
    l1, l2, l3 = [], [], []
    for i in range(n):
        s = codes[7 * i:7 * i + 7]
        l1.append(s[0] % 4096); l2 += [s[1] % 4096, s[4] % 4096]; l3 += [s[2] % 4096, s[3] % 4096, s[5] % 4096, s[6] % 4096]
    t = [torch.tensor(x, dtype=torch.int32, device=DEV).unsqueeze(0) for x in (l1, l2, l3)]
    with torch.inference_mode():
        return snac.decode(t).squeeze().float().cpu().numpy()


def load(repo):
    tok = AutoTokenizer.from_pretrained(repo)
    m = AutoModelForCausalLM.from_pretrained(repo, dtype=torch.bfloat16).to(DEV).eval()
    return tok, m


def gen(m, ids, **kw):
    x = torch.tensor([ids], device=DEV)
    with torch.inference_mode():
        out = m.generate(x, attention_mask=torch.ones_like(x), do_sample=True, **kw)
    return out[0, len(ids):].tolist()


def codes_until(ids, stop=128258):
    if stop in ids: ids = ids[:ids.index(stop)]
    return [t - OFF for t in ids if OFF <= t < OFF + 7 * 4096]


class Veena:
    repo = 'maya-research/Veena'
    def __init__(s): s.tok, s.m = load(s.repo)
    def say(s, text, spk):
        ids = [128259, *s.tok.encode(f'<spk_{spk}> {text}', add_special_tokens=False), 128260, 128261, 128257]
        return codes_until(gen(s.m, ids, max_new_tokens=1600, temperature=0.4, top_p=0.9, repetition_penalty=1.05,
                               eos_token_id=[128258, 128262], pad_token_id=s.tok.pad_token_id or 128263))


class Maya1:
    repo = 'maya-research/maya1'
    def __init__(s): s.tok, s.m = load(s.repo)
    def say(s, text, desc):
        d = s.tok.decode
        p = d([128259]) + s.tok.bos_token + f'<description="{desc}"> {text}' + d([128009]) + d([128260]) + d([128261]) + d([128257])
        ids = s.tok(p, add_special_tokens=False).input_ids
        return codes_until(gen(s.m, ids, max_new_tokens=1800, min_new_tokens=28, temperature=0.4, top_p=0.9,
                               repetition_penalty=1.1, eos_token_id=128258, pad_token_id=s.tok.pad_token_id or 128263))


class Svara:
    repo = 'kenpath/svara-tts-v1'
    def __init__(s): s.tok, s.m = load(s.repo)
    def say(s, text, spk):
        ids = [128259, *s.tok(f'{spk}: {text}').input_ids, 128009, 128260]
        out = gen(s.m, ids, max_new_tokens=1800, temperature=0.7, top_p=0.8, repetition_penalty=1.1, eos_token_id=128258,
                  pad_token_id=s.tok.pad_token_id or 128263)
        if 128257 in out: out = out[len(out) - out[::-1].index(128257):]
        return [t - OFF for t in out if OFF <= t < OFF + 7 * 4096]


INDIAN = ('Realistic female voice in the 30s age with a indian accent. Normal pitch, {timbre} timbre, conversational pacing, '
          'neutral tone delivery at med intensity, {domain} domain, {role} role, neutral delivery')
VOICES = {
    'veena': (Veena, {'kavya': 'kavya', 'maitri': 'maitri', 'vinaya': 'vinaya'}),
    'maya1': (Maya1, {'explainer': INDIAN.format(timbre='warm', domain='corporate', role='explainer_video_voice'),
                      'spokesperson': INDIAN.format(timbre='smooth', domain='commercial', role='brand_spokesperson'),
                      'brisk': INDIAN.format(timbre='warm', domain='corporate', role='explainer_video_voice').replace('conversational pacing', 'brisk pacing'),
                      'brisk-smooth': INDIAN.format(timbre='smooth', domain='commercial', role='brand_spokesperson').replace('conversational pacing', 'brisk pacing')}),
    'maya1b': (Maya1, {'brisk': INDIAN.format(timbre='warm', domain='corporate', role='explainer_video_voice').replace('conversational pacing', 'brisk pacing'),
                       'brisk-smooth': INDIAN.format(timbre='smooth', domain='commercial', role='brand_spokesperson').replace('conversational pacing', 'brisk pacing')}),
    'svara': (Svara, {'female': 'English (Female)'}),
}

if __name__ == '__main__':
    text = open(sys.argv[1]).read().strip()
    out = sys.argv[2]
    only = sys.argv[3].split(',') if len(sys.argv) > 3 else list(VOICES)
    sents = [x.strip() for x in re.split(r'(?<=[.!?])\s+', text) if x.strip()]
    gap = np.zeros(int(0.3 * 24000), np.float32)
    for name in only:
        cls, voices = VOICES[name]
        t0 = time.time(); model = cls(); print(name, 'loaded', round(time.time() - t0, 1), 's', flush=True)
        for v, arg in voices.items():
            torch.manual_seed(0)
            t0 = time.time(); parts = []
            for sn in sents:
                parts += [decode(model.say(sn, arg)), gap]
            a = np.concatenate(parts)
            sf.write(f'{out}/{name}-{v}.wav', a, 24000)
            print(name, v, round(len(a) / 24000, 2), 's audio in', round(time.time() - t0, 1), 's', flush=True)
        del model; gc.collect(); torch.mps.empty_cache()
