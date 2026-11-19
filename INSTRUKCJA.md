# DuckWay — instrukcja krok po kroku

Jak uruchomić aplikację i co po kolei klikać, żeby pokazać każdą funkcję. Napisy z aplikacji są po angielsku i **pogrubione** — dokładnie tak wyglądają na ekranie.

## Zanim zaczniesz

1. W terminalu, w folderze projektu, uruchom: `python3 -m http.server 4173`
2. Otwórz w **Chrome**: <http://localhost:4173>
3. Gdy przeglądarka zapyta o lokalizację — kliknij **Zezwól**. Bez zgody mapa pokaże centrum Warszawy (wszystko działa tak samo).
4. Przed każdym nagraniem wyczyść dane: zakładka **Community** → na samym dole **Reset my data** → OK. Wracają 0 punktów, puste odznaki i popup powitalny.

Dobrze wiedzieć podczas nagrywania:

- Kaczka Ducky (lewy dolny róg) co ok. 16 sekund sama pokazuje dymek z podpowiedzią albo „co się dzieje w okolicy". Nie da się tego wyłączyć — po prostu poczekaj, aż zniknie, jeśli zasłania ujęcie.
- Jeśli na mapie pojawi się przycisk **Retry live data**, to znaczy, że nie udało się pobrać prawdziwych toalet i widzisz dane przykładowe. Kliknij go, żeby spróbować ponownie.

## Szybki scenariusz na film (ok. 2 minuty)

Ta kolejka pokazuje najwięcej animacji i kończy się awansem na wyższą rangę.

| # | Co klikasz | Co widać |
| --- | --- | --- |
| 1 | Odśwież stronę po **Reset my data** | Ekran startowy z pływającą kaczką, potem popup powitalny |
| 2 | **Next** → **Next** → **Let's go!** | Trzy kolorowe slajdy, na końcu konfetti i dymek Ducky |
| 3 | Nic — popatrz na mapę | Pinezki spadają jedna po drugiej, liczniki u góry nabijają się od zera |
| 4 | **Find nearest toilet** | Trasa piesza, Ducky drepcze po niej, z prawej wysuwa się karta toalety |
| 5 | **I'm here!** (biały pasek na dole mapy) | Konfetti, +5 punktów (moneta leci do licznika), odznaki **First Quack** i **Waddler**, popup **You made it!** |
| 6 | **Rate this toilet** | Okno oceny |
| 7 | Kliknij gwiazdki przy **Cleanliness**, potem **Publish review** | +20 punktów, odznaka **Loo Critic** |
| 8 | W karcie toalety przewiń do **Live status** → **Still open** | +5 punktów, popup **All quests done!** z bonusem +30 |
| 9 | **Yay!** | Popup awansu **You're a Duckling now!** z konfetti |
| 10 | **See my profile** | Zakładka Community: punkty, rangi, odznaki, zadania dnia |

## 1. Ekran główny (zakładka Explore)

### Mapa i lokalizacja

1. Po wejściu mapa sama ustawia się na Twojej lokalizacji — niebieska pulsująca kropka to Ty.
2. Kolory pinezek: niebieska = toaleta miejska, różowa = restauracja lub kawiarnia, fioletowa = galeria handlowa, pomarańczowa = stacja paliw, miętowa z domkiem = prywatna toaleta. Szara = zamknięta. Żółta gwiazdka przy pinezce = wybór Ducky.
3. Najedź myszką na pinezkę — pokaże się dymek z nazwą, odległością i ceną.
4. Okrągły przycisk z celownikiem (prawy górny róg mapy) wraca do Twojej lokalizacji.
5. Przesuń mapę daleko w bok (ponad kilometr) — u góry pojawi się **Search this area**. Kliknij, żeby wczytać toalety w nowym miejscu. Potem **Back to my location** wraca do Ciebie.

### Najbliższa toaleta jednym kliknięciem

1. Kliknij duży niebieski przycisk **Find nearest toilet**.
2. Aplikacja wybiera najbliższą otwartą toaletę, rysuje trasę pieszą i otwiera jej kartę. Po trasie chodzi Ducky.
3. Na dole mapy jest pasek z czasem i dystansem (np. „3 min · 250 m"). Na nim:
   - **I'm here!** — kończy trasę z konfetti i proponuje ocenę,
   - ikona strzałki w kwadracie — otwiera tę samą trasę w Google Maps,
   - **✕** — przerywa nawigację.

### Wyszukiwarka

1. Wpisz nazwę miejsca, np. `Kraków`. Poczekaj chwilę na listę podpowiedzi i kliknij jedną — mapa przeskoczy tam i wczyta toalety.
2. Wpisz zdanie po angielsku, np. `free clean toilet with a changing table`, i naciśnij Enter. Aplikacja sama włączy pasujące filtry, otworzy najlepszą toaletę i pokaże fioletowy pasek **You asked: …** z wyjaśnieniem. Krzyżyk na pasku czyści wynik.
3. Inne zdania do pokazania:
   - `nearest accessible toilet open now` — od razu rysuje trasę,
   - `cheapest toilet within 500 m` — sortuje po cenie i ogranicza dystans,
   - `restaurant where I don't have to buy anything`.

### Wyszukiwanie głosowe

1. Kliknij różowy mikrofon w pasku wyszukiwania i zezwól na dostęp do mikrofonu.
2. Powiedz po angielsku: „Where is the nearest toilet?"
3. Tekst pojawi się w pasku, a aplikacja wyznaczy trasę. Działa w Chrome, Edge i Safari.

### Liczniki nad mapą

Trzy pigułki u góry po prawej (**open now**, **free**, **sparkling clean**) pokazują liczby i są klikalne — każda włącza odpowiedni filtr.

### Lista pod mapą

1. Przewiń pod mapę do **Nearby toilets**. Każda karta pokazuje odległość, czas dojścia, czy jest otwarte, cenę, zasady wejścia i ocenę czystości.
2. Kliknij kartę — otworzy się karta szczegółów. Kliknij **Navigate** na karcie — od razu ruszy trasa.
3. Na dole listy **Show … more** dokłada kolejne toalety.
4. Nad listą jest **Ducky's pick for you** — polecana toaleta z powodami (blisko, otwarta, czysta) i przyciskiem **Navigate**.

## 2. Filtry i sortowanie

1. Pasek **Filters** pod mapą: kliknij dowolny filtr, np. **Free** — podświetli się na kolorowo, a pinezki i lista od razu się zmienią.
2. Dostępne filtry: **Open now**, **Free**, **Paid**, **Accessible**, **Changing table**, **Unisex**, **Women / Men**, **Clean**, **No key**, **No purchase**, **Private hosts**. Pasek przewija się w bok.
3. Można łączyć kilka naraz, np. **Free** + **Accessible** + **Open now**. (**Free** i **Paid** oraz **Unisex** i **Women / Men** wykluczają się nawzajem.)
4. **Clear all** na końcu paska wyłącza wszystko.
5. Sortowanie: lista rozwijana **Sort** po prawej nad listą — **Nearest**, **Best rated**, **Cheapest**, **Most accessible**.

## 3. Karta toalety

1. Kliknij dowolną pinezkę albo kartę z listy. Z prawej wysunie się karta (na telefonie — od dołu).
2. Od góry widać:
   - ilustrację i typ miejsca (np. **City toilet**),
   - nazwę i adres,
   - cztery kolorowe kafelki: odległość, **Open/Closed** z godziną, cenę, średnią ocen,
   - zasady wejścia, np. **Open to everyone**, **Customers only · receipt code**, **Friendly Venue · no purchase**, **Ask for the key**,
   - **AI Cleanliness Score** — kółko z wynikiem 0–100, które się wypełnia,
   - **Good to know** — godziny otwarcia, cena i sposoby płatności, dostęp dla wózków, przewijak, klucz, rodzaj toalet,
   - **Live status** — ostatnie potwierdzenia i zgłoszenia,
   - **Photos**, **Ratings** (paski czystości, komfortu, zapachu, prywatności) i **Reviews**.
3. Na dole karty zawsze są dwa główne przyciski: **Navigate me** i **Add review**.
4. Karta zamyka się krzyżykiem w prawym górnym rogu albo klawiszem Esc.

Żeby pokazać restaurację z obowiązkiem zakupu: kliknij różową pinezkę z ceną **With purchase**. Żeby pokazać miejsce bez obowiązku zakupu: włącz filtr **No purchase**.

## 4. Oceny, zdjęcia i zgłoszenia (społeczność)

Wszystko poniżej robisz w otwartej karcie toalety.

### Dodanie opinii (+20 punktów)

1. Kliknij **Add review**.
2. Kliknij gwiazdki przy **Cleanliness** (wymagane), opcjonalnie **Comfort**, **Smell**, **Privacy**.
3. Opcjonalnie w **Quick check** zaznacz **Yes/No** przy papierze, mydle i zamku. Zaznaczenie **No** automatycznie dodaje zgłoszenie braku.
4. Opcjonalnie wpisz tekst i dodaj zdjęcia przyciskiem **Add photos** (+10 punktów dodatkowo).
5. Kliknij **Publish review**. Opinia pojawi się na górze listy, a wynik czystości się przeliczy.

### Dodanie zdjęcia (+10 punktów)

1. W sekcji **Photos** kliknij różowy kafelek **Add photo**.
2. Wybierz plik z dysku — zdjęcie pojawi się w galerii i na górze karty.

### Potwierdzenie, że toaleta działa (+5 punktów)

1. W sekcji **Live status** kliknij **Still open**.
2. Pojawi się wpis **Confirmed available just now … (including you)**. Tę samą toaletę można potwierdzić raz na godzinę.

### Zgłoszenie problemu (+10 punktów)

1. W **Live status** kliknij **Report a problem**.
2. Zaznacz jedno lub więcej: **Closed / out of order**, **No toilet paper**, **No soap**, **Lock is broken**.
3. Kliknij **Send report**.
4. Po zgłoszeniu **Closed** pinezka robi się szara, a karta pokazuje **Reported closed**. Kliknięcie **Still open** cofa to oznaczenie — dobre do pokazania, jak społeczność poprawia dane.

### Aktualizacja godzin otwarcia (+15 punktów)

1. W **Live status** kliknij **Update hours**.
2. Wyłącz przełącznik **Open 24 hours** i ustaw **Opens** / **Closes**, albo zostaw włączony.
3. Kliknij **Save hours**. W karcie przy godzinach pojawi się dopisek **updated by you**.

### Dodanie nowej toalety (+50 punktów)

1. Na mapie kliknij okrągły różowy przycisk z pinezką i plusem (prawy górny róg mapy, drugi od góry).
2. Przesuń mapę tak, żeby podskakująca pinezka wskazywała miejsce. Kliknij **Use this spot**.
3. Wypełnij **Name**, wybierz **Type of place**, ustaw cenę (0 = darmowa), godziny i zaznacz cechy (np. **Wheelchair accessible**, **Changing table**).
4. Kliknij **Add toilet**. Konfetti, nowa pinezka na mapie i od razu otwarta karta tej toalety. Na liście pod mapą ma dopisek **added by you**.

## 5. Prywatne toalety — korzystanie

1. Włącz filtr **Private hosts** — zostaną same miętowe pinezki z domkiem.
2. Kliknij jedną z nich. W karcie widać gospodarza (**Hosted by …**), jego opis, zasady i cenę za wejście (kilkadziesiąt groszy do 2 zł).
3. Na dole kliknij **Get access · cena** (gospodarz wpuszcza od razu) albo **Request access · cena** (gospodarz musi zaakceptować).
4. W oknie wybierz, kiedy przyjdziesz (**Right now**, **In 10 min**, **In 30 min**) i czym płacisz (**DuckWay wallet**, **Card**, **BLIK**).
5. Kliknij **Pay and get the door code** albo **Send request**.
6. Po chwili oczekiwania (pływająca kaczka) pojawi się ekran **… is expecting you** z czterocyfrowym kodem do drzwi i konfetti. **Navigate me there** wyznacza trasę.
7. W karcie tej toalety zostaje kolorowy pasek **Door code …**, a w zakładce Community w **Access passes** — historia rezerwacji.

Płatność jest symulowana — żadne pieniądze nie są pobierane.

## 6. Wynajem własnej toalety (zakładka Host)

1. Kliknij **Host** w górnym menu.
2. Kliknij **List your toilet**.
3. Przesuń mapę na swoje miejsce i kliknij **Use this spot**.
4. Wypełnij **Listing title**, **Price per visit** i **Your first name**. Ustaw godziny.
5. Ważne dla filmu — opcja **Instant access (no approval)**:
   - odznacz ją, jeśli chcesz pokazać prośbę gościa z przyciskami Accept/Decline,
   - zostaw zaznaczoną, jeśli chcesz, żeby zarobek doliczał się sam.
6. Kliknij **Publish listing**. Konfetti, odznaka **Super Host**, a ogłoszenie pojawia się w **Your listings** i jako miętowa pinezka na mapie.
7. Poczekaj ok. 10 sekund. Pojawi się powiadomienie o gościu:
   - bez Instant access: pulsujący panel **Knock knock! 🚪** z imieniem gościa i przyciskami **Decline** / **Accept**. Kliknij **Accept** — konfetti i wzrost **Earned so far** oraz **Guests hosted**,
   - z Instant access: sam komunikat „… used instant access · you earned …".
8. Kolejna prośba przychodzi po ok. 20 sekundach. Historia jest w **Recent visits**.
9. **View** przy ogłoszeniu pokazuje je na mapie, ikona kosza je usuwa.

Prośby gości są symulowane.

## 7. Punkty, rangi, odznaki (zakładka Community)

1. Kliknij **Community** w górnym menu albo licznik punktów w prawym górnym rogu.
2. Kliknij w **Add your name** i wpisz imię — będzie widoczne przy Twoich opiniach i w rankingu.
3. U góry: liczba punktów, pasek postępu do kolejnej rangi i pięć rang: **Hatchling** (0), **Duckling** (40), **Paddler** (120), **Navigator** (300), **Flock Leader** (600).
4. **Daily quests** — trzy zadania na dziś. Po wykonaniu wszystkich: bonus +30 punktów i popup.
5. **Badges** — osiem odznak; zdobyte są kolorowe, reszta szara z kłódką.
6. **Earn trust points** — cennik punktów. **Leaderboard** — ranking z Tobą na liście.
7. **Your preferences** — cztery przełączniki. Włącz np. **I need a changing table**, wróć do **Explore** i zobacz, że **Ducky's pick for you** się zmienił.
8. **Recent activity** — lista Twoich ostatnich akcji z punktami.

Za co są punkty i odznaki:

| Akcja | Punkty | Odznaka |
| --- | --- | --- |
| Pierwsza dowolna akcja | — | First Quack |
| Dojście do toalety (**I'm here!**) | +5 | Waddler |
| Potwierdzenie (**Still open**) | +5 | — |
| Zgłoszenie problemu | +10 | Watchduck |
| Dodanie zdjęcia | +10 | Paparazzi |
| Aktualizacja godzin | +15 | — |
| Opinia | +20 | Loo Critic |
| Nowa toaleta | +50 | Pathfinder |
| Rezerwacja prywatnej toalety | +5 | VIP Guest |
| Wystawienie własnej toalety | — | Super Host |
| Wszystkie 3 zadania dnia | +30 | — |

Najszybszy awans do pokazania: dodaj nową toaletę (+50) — od razu przekraczasz 40 punktów i wyskakuje popup **You're a Duckling now!**

## 8. Kaczka Ducky i popupy

1. Kliknij kaczkę w lewym dolnym rogu. Podskoczy i otworzy menu **Quack! Need a wing?**:
   - **Surprise me** — losuje ładną, otwartą toaletę w pobliżu, otwiera ją z konfetti,
   - **Daily quests** — przenosi do zadań dnia,
   - **Show the intro** — jeszcze raz pokazuje popup powitalny (bez resetowania danych).
2. Dymek „Happening nearby" przy kaczce jest klikalny — otwiera toaletę, o której mówi.
3. Lista popupów i jak je wywołać:

| Popup | Jak wywołać |
| --- | --- |
| Powitalny (3 slajdy) | Pierwsze wejście po **Reset my data** albo Ducky → **Show the intro** |
| **You made it!** | **Find nearest toilet** → **I'm here!** |
| Baner **Badge unlocked!** | Pierwsze wykonanie akcji z tabeli wyżej |
| Baner **Quest … done** | Wykonanie zadania dnia |
| **All quests done!** | Trzecie zadanie dnia |
| **You're a … now!** | Przekroczenie progu rangi (40, 120, 300, 600 punktów) |
| Kod do drzwi | Rezerwacja prywatnej toalety |
| **Knock knock!** | Zakładka Host, ok. 10 s po wystawieniu toalety bez Instant access |

## 9. Telefon

Aplikacja działa też na wąskim ekranie. Żeby to pokazać na komputerze: w Chrome naciśnij F12, potem ikonę telefonu (Cmd+Shift+M) i wybierz np. iPhone. Menu przenosi się na dół ekranu, a karta toalety wysuwa się od dołu.

## Gdy coś nie działa

| Problem | Co zrobić |
| --- | --- |
| Stary wygląd strony | Odśwież z pominięciem pamięci: Cmd+Shift+R |
| Mapa pokazuje Warszawę zamiast mojej okolicy | Zezwól na lokalizację w pasku adresu Chrome i kliknij przycisk z celownikiem |
| Przycisk **Retry live data** na mapie | Serwer OpenStreetMap nie odpowiedział — kliknij przycisk albo nagrywaj na danych przykładowych |
| Mikrofon nie reaguje | Użyj Chrome i zezwól na mikrofon; wyszukiwanie głosowe rozumie angielski |
| Popup powitalny się nie pojawia | Community → **Reset my data**, albo Ducky → **Show the intro** |
| **Still open** nie daje punktów | Tę toaletę potwierdzono w ostatniej godzinie — wybierz inną |
| Strona się nie otwiera | Sprawdź, czy w terminalu nadal działa `python3 -m http.server 4173` |
