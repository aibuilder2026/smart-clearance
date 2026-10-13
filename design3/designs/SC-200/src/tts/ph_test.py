import os, sys, numpy as np, soundfile as sf
import misaki.espeak  # noqa
from phonemizer.backend.espeak.wrapper import EspeakWrapper
EspeakWrapper.set_data_path(os.path.expanduser("~/.cache/sc200-espeak/espeak-ng-data"))
from kokoro import KPipeline
pipe = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M", device="cpu")
tests = {
 "rk1": "Rakesh sends two photos, before and after.",
 "rk2": "[Rakesh](/ɹˈɑkAʃ/) sends two photos, before and after.",
 "rk3": "[Rakesh](/ɹɑkˈAʃ/) sends two photos, before and after.",
 "pr1": "Only after Priya's second yes.",
 "pr2": "Only after [Priya's](/pɹˈijəz/) second yes.",
}
for k, t in tests.items():
    for gs, ps, a in pipe(t, voice="af_heart", speed=0.94, split_pattern=None):
        print(k, ps, flush=True)
        sf.write(f"bake/{k}.wav", a.numpy(), 24000)
