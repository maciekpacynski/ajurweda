# Ajurweda – Prakriti Parikshana

Aplikacja przeglądarkowa do badania konstytucji (prakriti) według klasycznego formularza *Prakriti Parikshana*: 317 cech Vata, Pitta i Kapha z tekstów Charaki, Sushruty, Ashtanga Hridaya i Harity.

**Adres:** https://maciekpacynski.github.io/ajurweda/pp.html

## Jak działa

1. Badający wpisuje dane badanego (kod, wiek, płeć, porę roku).
2. Przechodzi przez 27 sekcji i zaznacza cechy zaobserwowane u badanej osoby.
3. Aplikacja liczy wynik metodą formularza:
   - **pokrycie** = zaznaczone cechy danej doszy ÷ wszystkie jej cechy,
   - **udział** = pokrycie ÷ suma pokryć trzech dosz,
   - **typ**: *Sama*, gdy wszystkie udziały różnią się o mniej niż 10 pkt proc.; dwudoszowy, gdy dwie pierwsze dosze różnią się o mniej niż 10 pkt proc.; w pozostałych przypadkach jednodoszowy.
4. Raport można wydrukować, zapisać jako PDF, JSON (do ponownego wczytania) lub CSV.

U kobiet 7 cech dotyczących zarostu i odbioru przez kobiety jest pomijanych i nie wlicza się do mianownika (Vata 113, Pitta 83, Kapha 114 zamiast 116 / 87 / 114).

Dane zapisują się wyłącznie w przeglądarce (localStorage, klucz `pp-state-v1`). Aplikacja nie wysyła niczego na żaden serwer.

## Struktura

```
pp.html                  strona aplikacji
pp/config.js             stałe (próg typu mieszanego, klucze zapisu)
pp/css/style.css         wygląd, wersja mobilna, wydruk
pp/data/cechy.js         317 cech (generowane; kopia w cechy.json)
pp/data/sekcje.js        27 sekcji z podpowiedziami dla badającego
pp/js/scoring.js         punktacja (czyste funkcje)
pp/js/storage.js         zapis, import/eksport
pp/js/i18n.js            teksty PL / EN
pp/js/app.js             ekrany i raport
pp/tests/                testy punktacji
```

Dane i teksty są w plikach `.js`, a nie `.json`, żeby aplikacja działała także po otwarciu `pp.html` bezpośrednio z dysku.

## Publikacja

W terminalu PyCharm, w folderze projektu:

```
python tools/publish.py "Opis zmiany"
```

Skrypt odświeża dane, uruchamia testy i wysyła zmiany na GitHub (`git add`, `commit`, `push`). Przy pierwszym uruchomieniu sam łączy folder z repozytorium `maciekpacynski/ajurweda`.

## Testy

- w przeglądarce: otwórz `pp/tests/scoring.test.html`,
- w terminalu (Node.js): `node pp/tests/run-node.js`.

## Źródła

Cechy według formularza *Prakriti Parikshana* (wydział Ajurwedy; lista prowadzących w dokumencie źródłowym), zweryfikowane z tekstami:

- Charaka Saṃhitā, Vimāna Sthāna 8.95–100
- Suśruta Saṃhitā, Śārīra Sthāna 4.64–75
- Aṣṭāṅga Hṛdaya, Śārīra Sthāna 3.83–103
- Hārīta Saṃhitā, Prathama Sthāna 5.16–22 (wyd. Khemraj, Bombaj 1962)

Podpowiedzi dla badającego opracowano na podstawie materiałów szkoleniowych kampanii *Desh ka Prakriti Parikshan* (NCISM / Ministerstwo AYUSH, CSIR-IGIB), własnymi słowami.

Poprawki względem formularza (dosza bez zmian): *anavasthita akṣi* zamiast „asthi (bones)”, *ati danta* = za duże zęby, *prodbaddha piṇḍikā* = wydatne łydki, *bhūryuccāra* = obfite wypróżnienia (przeniesione do sekcji Wydaliny), *laulya* = upodobanie do zmienności, *sukeśa* = ładne włosy.

## Zastrzeżenie

Wynik ma charakter edukacyjny. Nie jest diagnozą medyczną i nie zastępuje konsultacji z lekarzem.

## Licencja

Kod: MIT (plik `LICENSE`). Treść cech pochodzi z tekstów klasycznych; formularz źródłowy należy do jego autorów.
