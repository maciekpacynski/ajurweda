"""Regenerate pp/data/cechy.js and sekcje.js. Run from the repo root: python tools/gen_data.py"""
import json, re, os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "pp/data"
os.makedirs(OUT, exist_ok=True)
rows = json.load(open("tools/prakriti_cechy.json", encoding="utf-8"))

# Verse references actually verified (per dosha)
VERSE = {
    "Charaka": {"V": "Ca Vi 8.98", "P": "Ca Vi 8.97", "K": "Ca Vi 8.96"},
    "Ashtanga Hridaya": {"V": "AH Śā 3.85–89", "P": "AH Śā 3.90–95", "K": "AH Śā 3.96–103"},
    "Sushruta": {"V": "Su Śā 4.64", "P": "Su Śā 4.68", "K": "Su Śā 4"},
    "Harita": {"V": "Hā 1.5.17–18", "P": "Hā 1.5.19–20", "K": "Hā 1.5.21–22"},
}
FIX_SOURCE = {"02-K08": "Ashtanga Hridaya", "08-K01": "Charaka"}

SENSITIVE_SA = {"स्तेन", "मत्सरी", "अनार्य / न आर्य", "कृतघ्न", "नास्तिक", "धर्मात्मा",
                "श्राध्द", "आर्य", "सुचरित", "भूःईर्ष्या", "न कान्तदायिता", "नारीणां अनभिमतो"}
SENSITIVE_SECTIONS = {22, 23, 27}
SINGLE_CHOICE = {15: "strength", 16: "agni", 22: "facilities", 23: "wealth"}

out = []
for r in rows:
    sec = int(r["sekcja"].split(".")[0])
    d = r["dosza"][0]
    en = r["english"]
    note = ""
    m = re.search(r"\s*\(([^()]*form:[^()]*)\)", en)
    if m:
        note = m.group(1)
        en = (en[:m.start()] + en[m.end():]).strip()
    sa = r["sanskryt"]
    if sa == "भूर्युच्चार":
        sec = 17  # means abundant excretion (AH Śā 3.93)
    srcs = [s.strip() for s in FIX_SOURCE.get(r["id"], r["zrodlo"]).split(",") if s.strip() and s.strip() != "—"]
    refs = [VERSE[s][d] for s in srcs]
    item = {
        "id": r["id"], "s": sec, "d": d, "sa": sa,
        "pl": r["polski"], "en": en, "src": refs,
    }
    if note:
        item["note"] = note
    if "श्मश्रु" in sa or sa == "नारीणां अनभिमतो":
        item["male"] = 1
    if sec in SENSITIVE_SECTIONS or sa in SENSITIVE_SA:
        item["sens"] = 1
    if sec in SINGLE_CHOICE:
        item["grp"] = SINGLE_CHOICE[sec]
    out.append(item)

out.sort(key=lambda x: (x["s"], "VPK".index(x["d"])))
# re-id after the section move so ids stay unique and readable
cnt = {}
for x in out:
    k = (x["s"], x["d"])
    cnt[k] = cnt.get(k, 0) + 1
    x["id"] = f"{x['s']:02d}-{x['d']}{cnt[k]:02d}"

SECTIONS = [
 (1, "शरीर", "Ciało", "Body", "Oceń budowę całego ciała w odniesieniu do wieku, płci i typowej budowy w populacji. Wyklucz otyłość, obrzęki, wyniszczenie chorobowe i ciążę.", "Judge the whole body against age, sex and the population norm. Rule out obesity, swelling, wasting from illness and pregnancy."),
 (2, "अवयव", "Części ciała", "Body parts", "Patrz na proporcje poszczególnych części i ich ruchliwość. Zmiany skórne oceniaj tylko, jeśli są stałe, a nie wynikiem alergii, infekcji czy leków.", "Look at the proportions and mobility of individual parts. Count skin marks only if they are constitutional, not from allergy, infection or medication."),
 (3, "दंत", "Zęby", "Teeth", "Oceniaj w dziennym świetle. Wyklucz próchnicę, kamień, przebarwienia od nałogów, fluorozę i zabiegi ortodontyczne lub kosmetyczne.", "Examine in daylight. Rule out caries, tartar, stains from habits, fluorosis and orthodontic or cosmetic work."),
 (4, "नेत्र", "Oczy", "Eyes", "Wielkość oka oceniaj po tym, ile białka widać wokół tęczówki. Wyklucz zaczerwienienie od zmęczenia, infekcji lub alergii.", "Judge eye size by how much white shows around the iris. Rule out redness from fatigue, infection or allergy."),
 (5, "त्वचा / वर्ण", "Skóra i karnacja", "Skin and complexion", "Oceniaj w naturalnym świetle, na twarzy i przedramieniu. Wyklucz opaleniznę, kosmetyki, żółtaczkę, anemię i choroby skóry. Zmarszczki licz tylko przedwczesne.", "Examine face and forearm in natural light. Rule out tan, cosmetics, jaundice, anaemia and skin disease. Count only premature wrinkles."),
 (6, "केश / लोम / रोम / श्मश्रु", "Włosy i owłosienie", "Hair", "Upewnij się, że włosy nie są farbowane ani zabiegowo zmienione. Przy siwieniu zapytaj, w jakim wieku się zaczęło. Odróżnij wypadanie od łamania się włosów.", "Make sure the hair is not dyed or chemically treated. For greying ask at what age it began. Distinguish hair fall from breakage."),
 (7, "नख", "Paznokcie", "Nails", "Wyklucz lakier, hybrydy, grzybicę i zmiany od pracy fizycznej.", "Rule out polish, gel nails, fungal infection and changes from manual work."),
 (8, "संधि", "Stawy", "Joints", "Wielkość stawu oceniaj po strukturach wokół niego. Wyklucz zmiany zwyrodnieniowe, dnę, urazy.", "Judge joint size by the tissue around it. Rule out arthritis, gout and injuries."),
 (9, "क्षुत्", "Głód", "Hunger", "Pytaj o stały wzorzec, nie o ostatnie tygodnie. Wyklucz cukrzycę, nadczynność tarczycy, stres i leki zmieniające apetyt.", "Ask about the lifelong pattern, not recent weeks. Rule out diabetes, hyperthyroidism, stress and appetite-changing drugs."),
 (10, "तृट्", "Pragnienie", "Thirst", "Pytaj o typowe pragnienie poza upałem i wysiłkiem.", "Ask about usual thirst outside heat and exercise."),
 (11, "क्रिया / चेष्टा / गति", "Aktywność i chód", "Activity and gait", "Obserwuj chód i ruchy od wejścia osoby do gabinetu. Wyklucz urazy, ból i choroby neurologiczne.", "Watch gait and movement from the moment the person enters. Rule out injury, pain and neurological disease."),
 (12, "वाणी / स्वर", "Głos i mowa", "Voice and speech", "Oceniaj podczas zwykłej rozmowy. Zdenerwowanie lub zawód (np. nauczyciel) mogą zmieniać tempo i ilość mowy.", "Assess during ordinary conversation. Nervousness or occupation (e.g. teaching) can change pace and amount of speech."),
 (13, "निद्रा", "Sen", "Sleep", "Wyklucz pracę zmianową, ból przewlekły, depresję, bezdech i leki.", "Rule out shift work, chronic pain, depression, sleep apnoea and medication."),
 (14, "स्वप्न", "Sny", "Dreams", "Pytaj o sny powtarzające się przez całe życie. Alkohol, leki i stres mogą zmieniać sny.", "Ask about dreams that recur throughout life. Alcohol, drugs and stress can change dreams."),
 (15, "बल", "Siła fizyczna", "Physical strength", "Wybierz jedną odpowiedź. Oceniaj wytrzymałość na wysiłek w porównaniu z rówieśnikami.", "Choose one. Judge stamina compared with people of the same age."),
 (16, "अग्नि", "Trawienie (agni)", "Digestion (agni)", "Wybierz jedną odpowiedź. Silne: trawi każdą ilość; słabe: musi uważać na ilość i rodzaj jedzenia; nieregularne: raz dobrze, raz źle bez wyraźnej przyczyny.", "Choose one. Strong: digests any amount; weak: must be careful with amount and kind of food; irregular: sometimes good, sometimes poor for no clear reason."),
 (17, "मलद्रव्ये", "Wydaliny", "Waste products", "Pytaj o stały wzorzec pocenia się i wypróżnień, nie o zmiany po chorobie czy lekach.", "Ask about the lifelong pattern of sweating and bowel movements, not changes due to illness or medication."),
 (18, "अभिरुचि", "Upodobania", "Likings", "Pytaj o upodobania stałe, a przy smakach także o to, co jest dobrze tolerowane.", "Ask about lasting preferences; for tastes, also what is well tolerated."),
 (19, "अनभिरुचि", "Nietolerancje", "Dislikings", "Pytaj, czego osoba stale nie znosi: zimna, upału, ostrych potraw, stresu.", "Ask what the person consistently cannot bear: cold, heat, spicy food, stress."),
 (20, "बुद्धिः, स्मृति", "Intelekt i pamięć", "Intelligence and memory", "Wyklucz choroby i leki wpływające na pamięć oraz zaburzenia nastroju.", "Rule out diseases and drugs affecting memory, and mood disorders."),
 (21, "सौहृद", "Przyjaźnie", "Friendships", "Pytaj, jak długo trwają przyjaźnie i znajomości.", "Ask how long friendships and acquaintances last."),
 (22, "इतर साधन", "Zasoby", "Means", "Wybierz jedną odpowiedź. Cecha z tekstu klasycznego (Charaka) opisująca typowe zasoby osoby danej konstytucji.", "Choose one. A classical trait (Charaka) describing the typical means of each constitution."),
 (23, "धन", "Majątek", "Wealth", "Wybierz jedną odpowiedź. Cecha z tekstu klasycznego (Charaka, Sushruta).", "Choose one. A classical trait (Charaka, Sushruta)."),
 (24, "विकार", "Podatność na choroby", "Susceptibility to disease", "Pytaj o całe życie, nie o ostatni okres.", "Ask about the whole life, not the recent period."),
 (25, "अन्य", "Inne", "Miscellaneous", "", ""),
 (26, "स्वभाव", "Natura i temperament", "Nature and temperament", "Pytaj o stałe skłonności, bez sugerowania odpowiedzi i bez oceniania. Wyklucz zaburzenia nastroju i wpływ substancji.", "Ask about lasting tendencies, without suggesting answers or judging. Rule out mood disorders and substance effects."),
 (27, "अनुकत्व", "Podobieństwo (anukatva)", "Resemblance (anukatva)", "Klasyczna typologia z Sushruty: do jakiego zwierzęcia lub istoty jest podobny charakter osoby. Zaznacz tylko wyraźne podobieństwa.", "Classical typology from Sushruta: which animal or being the person's character resembles. Tick only clear resemblances."),
]
secs = [{"n": n, "sa": sa, "pl": pl, "en": en, "hint_pl": hp, "hint_en": he,
         **({"grp": SINGLE_CHOICE[n]} if n in SINGLE_CHOICE else {})}
        for n, sa, pl, en, hp, he in SECTIONS]

def js(name, obj):
    return f"/* Generated from the verified trait table. Do not edit by hand. */\nwindow.{name} = " + json.dumps(obj, ensure_ascii=False, indent=1) + ";\n"

open(f"{OUT}/cechy.js", "w", encoding="utf-8").write(js("PP_TRAITS", out))
open(f"{OUT}/sekcje.js", "w", encoding="utf-8").write(js("PP_SECTIONS", secs))
json.dump(out, open(f"{OUT}/cechy.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

from collections import Counter
c = Counter(x["d"] for x in out); cf = Counter(x["d"] for x in out if not x.get("male"))
print("all", dict(c), "female", dict(cf), "male-only", sum(1 for x in out if x.get("male")),
      "sensitive", sum(1 for x in out if x.get("sens")), "grouped", sum(1 for x in out if x.get("grp")))
print("no source:", [x["id"] for x in out if not x["src"]])
