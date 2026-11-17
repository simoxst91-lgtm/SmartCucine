#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SMART CUCINE — rende il sito indipendente dal vecchio dominio.

Cosa fa, in ordine:
  1. legge tutti i file del sito e trova le immagini che puntano ancora a
     www.smartcucine.it
  2. le scarica dentro la cartella  immagini/
  3. riscrive i file del sito perche' usino le copie locali

Da fare UNA VOLTA SOLA, sul tuo computer, prima di mettere il sito online.

COME SI USA
  Apri il terminale nella cartella del sito e lancia:

      python3 prepara-immagini.py        (Mac e Linux)
      python prepara-immagini.py         (Windows)

  Serve solo Python, nessuna libreria da installare.
  Ci mette qualche minuto: sono circa 170 immagini.

PERCHE' SERVE
  Adesso le foto vengono caricate dal vecchio sito. Il giorno in cui il
  dominio smartcucine.it puntera' a questo sito nuovo, quei file non
  esisteranno piu' e TUTTE le foto spariranno. Con le immagini in locale
  il sito e' completo e autosufficiente.
"""

import os, re, sys, shutil
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

BASE = "https://www.smartcucine.it/wp-content/uploads/"
DIR = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(DIR, "immagini")
ESTENSIONI = (".html", ".js", ".json", ".css", ".xml")
UA = {"User-Agent": "Mozilla/5.0 (preparazione sito Smart Cucine)"}


def file_del_sito():
    for nome in sorted(os.listdir(DIR)):
        if nome.lower().endswith(ESTENSIONI):
            yield os.path.join(DIR, nome)


def trova_url():
    trovati = set()
    pattern = re.compile(re.escape(BASE) + r"[^\"'\s<>)]+")
    for percorso in file_del_sito():
        with open(percorso, encoding="utf-8") as f:
            trovati.update(pattern.findall(f.read()))
    return sorted(trovati)


def scarica(url, destinazione):
    os.makedirs(os.path.dirname(destinazione), exist_ok=True)
    richiesta = Request(url, headers=UA)
    with urlopen(richiesta, timeout=60) as risposta, open(destinazione, "wb") as out:
        shutil.copyfileobj(risposta, out)
    return os.path.getsize(destinazione)


def main():
    url = trova_url()
    if not url:
        print("Nessuna immagine da scaricare: il sito e' gia' autonomo.")
        return 0

    print(f"Trovate {len(url)} immagini da scaricare.\n")
    mappa, falliti, totale = {}, [], 0

    for i, u in enumerate(url, 1):
        relativo = u[len(BASE):]
        locale = os.path.join(DEST, relativo.replace("/", os.sep))
        mostra = relativo if len(relativo) < 58 else "..." + relativo[-55:]
        print(f"  [{i:3d}/{len(url)}] {mostra}", end=" ", flush=True)

        if os.path.exists(locale) and os.path.getsize(locale) > 0:
            print("(gia' presente)")
            mappa[u] = "immagini/" + relativo
            continue
        try:
            peso = scarica(u, locale)
            totale += peso
            print(f"{peso//1024} KB")
            mappa[u] = "immagini/" + relativo
        except (HTTPError, URLError, OSError) as e:
            print(f"ERRORE: {e}")
            falliti.append(u)

    if not mappa:
        print("\nNessuna immagine scaricata. Controlla la connessione.")
        return 1

    print(f"\nScaricati {len(mappa)} file, {totale/1024/1024:.1f} MB in totale.")
    if falliti:
        print(f"\nATTENZIONE: {len(falliti)} immagini non scaricate.")
        for u in falliti:
            print("  " + u)
        risposta = input("\nRiscrivo lo stesso i file del sito? [s/N] ").strip().lower()
        if risposta != "s":
            print("Interrotto. Nessun file del sito e' stato modificato.")
            return 1

    print("\nAggiorno i file del sito...")
    modificati = 0
    for percorso in file_del_sito():
        if os.path.basename(percorso) == os.path.basename(__file__):
            continue
        with open(percorso, encoding="utf-8") as f:
            testo = originale = f.read()
        for u, locale in mappa.items():
            testo = testo.replace(u, locale)
        if testo != originale:
            with open(percorso, "w", encoding="utf-8") as f:
                f.write(testo)
            modificati += 1
            print(f"  aggiornato  {os.path.basename(percorso)}")

    print(f"\nFatto: {modificati} file aggiornati.")
    print("Il sito ora usa le immagini della cartella  immagini/  e non")
    print("dipende piu' dal vecchio sito. Puoi caricarlo online.")
    if falliti:
        print(f"\nRicorda: {len(falliti)} immagini sono rimaste senza copia locale.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrotto.")
        sys.exit(1)
